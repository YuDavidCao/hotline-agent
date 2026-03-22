## Inspiration
Mental health is an important and personal topic for the members of our team. We wanted to create a project that supported others in difficult moments. 988, the Suicide and Crisis Lifeline is a critical part in helping people during desperate times. However, it's understaffed an understaffed service strained by an increasing number of calls. In 2025, 10% of 988's calls went unanswered. We wanted to fill in the void by using AI. We do **not** want to replace human operators. We want to fill in the gap void of unanswered calls to save lives. So, we created HoosThere. 

## What it does
We have a number you can call that's answered with an AI agent. The agent responds to the caller and acts as a crisis counselor. The transcript is then passed to a web application meant for human crisis counselors. On the web application, counselors can view the database of calls handled by AI agents and  read transcripts of calls. Counselors can review call transcripts and notes for a potential follow up. Calls can be marked as resolved. For repeat callers, counselors can view timeline and see snapshot of caller. 

## How we built it
- Receiving phone calls is handled by ElevenLabs. We use Gemini 3 Flash Preview with a configured prompt and a custom voice. Each call have a transcript, recording, and metadata. 
- Using webhooks, we makes requests containing the call information to our server API when calls finish.
- The information goes to our web application built with Next.js. Frontend is handled in React with Typescript and we use Prisma as our ORM connected to a PostgreSQL database hosted on NeonDB. 

## Challenges we ran into
Originally, our project was configured to use ReTell to handle calls and interface with the LLM model. However, we had consistency issues using ReTell due to webhook issues and poor configuration options, which we then switched to ElevenLabs.

## Accomplishments that we're proud of
We're proud of integrating a full-stack web application with a webhook AI call service in a seamless way. It took a good amount of work to get these two functioning individually, and integrating them was a difficult task. 

## What we learned
We're already strong full-stack developers but connecting to an API was something pretty new. Also working with a phone number and sending transcript over through a webhook was new for us. This was our first time implementing our own signal processing algorithm to sample phone calls and get information for dynamic UI elements beyond what was provided as metadata. Overall, we got better at using LLMs in the process and spent a lot of time configuring our system prompts for the Gemini/ChatGPT agents. 

## What's next for HoosThere
There are a couple of things we have planned still for the future of HoosThere.
1. Real-time transcript support. Rather than sending a request when the call ends, we could configure it to send an event when the transcript changes. This means someone has a live transcript of an ongoing call and could potentially hop in. 
2. Texting support. The Suicide Crisis Hotline also supports text messages. HoosThere could handle messaging to follow up with someone who recently called. 
3. Live signal handling for tone and semantics. Currently, there is no way for us to process and extract information from a live call, but tracking these ongoing calls would provide extra information that can be used for better processing and dynamic call routing.
4. Add context from previous calls. Our current interface does support adding context from a previous call (when we receive an inbound call, our backend doesn't get any information until the call is over, so we cannot pass context).  