import snowflake from "snowflake-sdk"

snowflake.configure({ logLevel: "WARN" })

function getConnection(): Promise<snowflake.Connection> {
  const conn = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    database: process.env.SNOWFLAKE_DATABASE!,
    schema: process.env.SNOWFLAKE_SCHEMA!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  })

  return new Promise((resolve, reject) => {
    conn.connect((err) => {
      if (err) reject(err)
      else resolve(conn)
    })
  })
}

function executeQuery<T = Record<string, unknown>>(
  conn: snowflake.Connection,
  sql: string,
  binds: snowflake.Binds = [],
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      binds,
      complete: (err, _stmt, rows) => {
        if (err) reject(err)
        else resolve((rows ?? []) as T[])
      },
    })
  })
}

/**
 * Extracts the "User: …" lines from the transcript.
 */
function extractUserLines(transcript: string): string[] {
  return transcript
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("User: "))
    .map((l) => l.slice(6).trim())
    .filter(Boolean)
}

/**
 * Calls SNOWFLAKE.CORTEX.SENTIMENT on each user line and returns
 * per-line scores (−1 to 1) plus an aggregate 0-100 risk score
 * where negative sentiment → higher risk.
 */
export async function analyzeUserSentiment(
  transcript: string,
): Promise<{ sentimentScore: number; lineScores: { text: string; score: number }[] }> {
  const userLines = extractUserLines(transcript)
  if (userLines.length === 0) {
    return { sentimentScore: 0, lineScores: [] }
  }

  let conn: snowflake.Connection | null = null
  try {
    conn = await getConnection()

    const placeholders = userLines.map((_, i) => `(?)`).join(", ")
    const sql = `
      SELECT column1 AS line_text,
             SNOWFLAKE.CORTEX.SENTIMENT(column1) AS score
        FROM VALUES ${placeholders}
    `

    const rows = await executeQuery<{ LINE_TEXT: string; SCORE: number }>(
      conn,
      sql,
      userLines,
    )

    const lineScores = rows.map((r) => ({
      text: r.LINE_TEXT,
      score: Number(r.SCORE),
    }))

    const avg =
      lineScores.reduce((sum, ls) => sum + ls.score, 0) / lineScores.length

    // −1 (very negative) → 100, 0 (neutral) → 50, 1 (positive) → 0
    const sentimentScore = Math.round((1 - avg) * 50)

    return { sentimentScore, lineScores }
  } finally {
    if (conn) {
      conn.destroy(() => {})
    }
  }
}
