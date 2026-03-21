'use client'

import { useSearchParams } from 'next/navigation'

export default function CallHistory() {
  const searchParams = useSearchParams()
  const number = searchParams.get('number')

  
  return <div>{number}</div>
}