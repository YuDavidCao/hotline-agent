// install the sdk: https://docs.retellai.com/get-started/sdk
import { NextResponse } from "next/server";
import { Retell } from "retell-sdk";

type RetellWebhookBody = {
  event?: string;
  call?: { call_id?: string; [key: string]: unknown };
};

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-retell-signature");
    const apiKey = process.env.RETELL_API_KEY;

    if (!signature || !apiKey || !Retell.verify(rawBody, apiKey, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { event, call }: RetellWebhookBody = JSON.parse(rawBody);

    switch (event) {
      case "call_started":
        console.log("Call started event received", call?.call_id);
        break;
      case "call_ended":
        console.log("Call ended event received", call?.call_id);
        console.log("Call data", call);
        break;
      case "call_analyzed":
        console.log("Call analyzed event received", call?.call_id);
        break;
      case "transcript_updated":
        console.log("Transcript updated event received", call?.call_id);
        break;
      case "transfer_started":
      case "transfer_bridged":
      case "transfer_cancelled":
      case "transfer_ended":
        console.log("Transfer event received", event, call?.call_id);
        break;
      default:
        console.log("Received an unknown event:", event);
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Retell webhook handler failed", error);
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
}

// {
//   call_id: 'call_2717da1d15a80a5f0bac89c1d39',
//   call_type: 'phone_call',
//   agent_id: 'agent_30adbb70640bf463a8ecefe37a',
//   agent_version: 1,
//   agent_name: 'Single-Prompt Agent',
//   retell_llm_dynamic_variables: {
//     'lk-call-info': 'CgwxOC45OC4xNi4xMjEQ5skCGAI=',
//     'lk-real-ip': '18.98.16.121',
//     'lk-transport': 'tcp',
//     'twilio-accountsid': 'ACa604531671b143294b17264a34e16ca3',
//     'twilio-callsid': 'CA42c17990c09cafca1a9e68c9511ee73a',
//     'twilio-verstat': 'TN-Validation-Passed-A'
//   },
//   custom_sip_headers: {
//     'x-lk-call-info': 'CgwxOC45OC4xNi4xMjEQ5skCGAI=',
//     'x-lk-real-ip': '18.98.16.121',
//     'x-lk-transport': 'tcp',
//     'x-twilio-accountsid': 'ACa604531671b143294b17264a34e16ca3',
//     'x-twilio-callsid': 'CA42c17990c09cafca1a9e68c9511ee73a',
//     'x-twilio-verstat': 'TN-Validation-Passed-A'
//   },
//   call_status: 'ended',
//   start_timestamp: 1774108687165,
//   end_timestamp: 1774108718110,
//   duration_ms: 30945,
//   transcript: 'Agent: Hey, I’m really glad you reached out. I’m here with you—what’s been going on?\n' +
//     "User: I am just I know I'm stressed right now. \n" +
//     'Agent: That sounds really tough. Stress can feel overwhelming sometimes. Would you like to tell me more about what’s making you feel this way?\n' +
//     'User: A lot of school work. \n' +
//     'Agent: School can definitely pile on the pressure. It’s okay to feel stressed about it. Is there a particular assignment or subject that’s feeling the hardest right now?\n',
//   transcript_object: [
//     {
//       role: 'agent',
//       content: 'Hey, I’m really glad you reached out. I’m here with you—what’s been going on?',
//       words: [Array],
//       metadata: [Object]
//     },
//     {
//       role: 'user',
//       content: "I am just I know I'm stressed right now. ",
//       words: [Array]
//     },
//     {
//       role: 'agent',
//       content: 'That sounds really tough. Stress can feel overwhelming sometimes. Would you like to tell me more about what’s making you feel this way?',
//       words: [Array],
//       metadata: [Object]
//     },
//     { role: 'user', content: 'A lot of school work. ', words: [Array] },
//     {
//       role: 'agent',
//       content: 'School can definitely pile on the pressure. It’s okay to feel stressed about it. Is there a particular assignment or subject that’s feeling the hardest right now?',
//       words: [Array],
//       metadata: [Object]
//     }
//   ],
//   transcript_with_tool_calls: [
//     {
//       role: 'agent',
//       content: 'Hey, I’m really glad you reached out. I’m here with you—what’s been going on?',
//       words: [Array],
//       metadata: [Object]
//     },
//     {
//       role: 'user',
//       content: "I am just I know I'm stressed right now. ",
//       words: [Array]
//     },
//     {
//       role: 'agent',
//       content: 'That sounds really tough. Stress can feel overwhelming sometimes. Would you like to tell me more about what’s making you feel this way?',
//       words: [Array],
//       metadata: [Object]
//     },
//     { role: 'user', content: 'A lot of school work. ', words: [Array] },
//     {
//       role: 'agent',
//       content: 'School can definitely pile on the pressure. It’s okay to feel stressed about it. Is there a particular assignment or subject that’s feeling the hardest right now?',
//       words: [Array],
//       metadata: [Object]
//     }
//   ],
//   recording_url: 'https://dxc03zgurdly9.cloudfront.net/8f508c23905a473bb0ba526722ab8ae600987e81f8d30333f5d1b48a2ec4db3b/recording.wav',
//   recording_multi_channel_url: 'https://dxc03zgurdly9.cloudfront.net/8f508c23905a473bb0ba526722ab8ae600987e81f8d30333f5d1b48a2ec4db3b/recording_multichannel.wav',
//   public_log_url: 'https://dxc03zgurdly9.cloudfront.net/8f508c23905a473bb0ba526722ab8ae600987e81f8d30333f5d1b48a2ec4db3b/public.log',
//   disconnection_reason: 'user_hangup',
//   latency: {
//     llm: {
//       p50: 366,
//       p90: 525.1999999999999,
//       p95: 545.1,
//       p99: 561.02,
//       min: 2,
//       max: 565,
//       num: 3,
//       values: [Array]
//     },
//     e2e: {
//       p50: 1818.50048828125,
//       p90: 2438.10009765625,
//       p95: 2515.550048828125,
//       p99: 2577.510009765625,
//       min: 1044.0009765625,
//       max: 2593,
//       num: 2,
//       values: [Array]
//     },
//     tts: {
//       p50: 243,
//       p90: 279,
//       p95: 283.5,
//       p99: 287.1,
//       min: 237,
//       max: 288,
//       num: 3,
//       values: [Array]
//     },
//     asr: {
//       p50: 29.998599999998987,
//       p90: 50,
//       p95: 1025.000250000001,
//       p99: 1805.0004500000025,
//       min: 9.998999999999796,
//       max: 2000.000500000002,
//       num: 11,
//       values: [Array]
//     }
//   },
//   call_cost: {
//     product_costs: [ [Object], [Object], [Object], [Object] ],
//     total_duration_seconds: 31,
//     total_duration_unit_price: 0.1683333,
//     combined_cost: 5.2183334
//   },
//   data_storage_setting: 'everything',
//   opt_in_signed_url: false,
//   llm_token_usage: {
//     values: [ 873, 908, 912 ],
//     average: 897.6666666666666,
//     num_requests: 3
//   },
//   tool_calls: [],
//   from_number: '+12405072696',
//   to_number: '+13186108029',
//   direction: 'inbound',
//   telephony_identifier: { twilio_call_sid: 'CA42c17990c09cafca1a9e68c9511ee73a' }
// }