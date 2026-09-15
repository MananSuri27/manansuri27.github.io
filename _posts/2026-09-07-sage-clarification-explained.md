---
layout: post
title: "Ask fewer, better questions: SAGE-Agent and ClarifyBench explained"
description: "How modeling uncertainty over tool parameters, not tokens, lets an LLM agent decide which clarifying question to ask and when to stop asking."
date: 2026-09-07 12:00:00
tags: agents tool-use clarification uncertainty
categories: research
thumbnail: assets/img/papers/sage-clarification/hero.png
related_posts: false
toc:
  beginning: true
---

You hand your phone to an assistant and say "Hey! can you call Alex from work for me?" Your contacts list has two people named Alex: Alex C., who has a work number, and Alex M., who has a home number. A careful human glances at the list and dials Alex C. A typical LLM agent does one of two things instead. It asks "Which Alex do you want to call?", a question the contacts list already answers, or it dials whoever comes first.

Both failures have the same root. The agent reasons about ambiguity in the space of words: it is prompted to write a clarifying question as free text, so it has no explicit picture of which argument is missing or whether the tool's own schema already pins it down. In our ACL 2026 Findings paper, [Structured Uncertainty Guided Clarification for LLM Agents](/papers/sage-clarification/), we with collaborators at Adobe Research and UMD move the uncertainty into the space of tool parameters and their domains. Once it lives there, "should I ask?" and "what should I ask?" become quantities the agent can compute.

## The idea in one picture

<div class="fig-svg">
<svg viewBox="0 0 900 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two requests, call Alex from work and text Maya, handled in token space by a baseline that asks a redundant question and silently picks a default, versus in parameter-domain space by SAGE-Agent, which executes directly for Alex and asks one question for Maya.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .h { fill: currentColor; font-size: 15px; font-weight: 600; }
    .in { stroke: #2698BA; }
    .bad { stroke: #F29105; }
    .acc { stroke: #B509AC; }
    .ok { fill: #00ab37; }
    .no { fill: #F29105; }
    .ar { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.5; }
  </style>
  <text class="h" x="130" y="30" text-anchor="middle" fill="#2698BA">Request</text>
  <text class="h" x="435" y="30" text-anchor="middle" fill="#F29105">Token space (prompted baseline)</text>
  <text class="h" x="750" y="30" text-anchor="middle" fill="#B509AC">Parameter domains (SAGE-Agent)</text>
  <!-- row 1 -->
  <rect class="n in" x="20" y="55" width="220" height="100" rx="10"/>
  <text class="t" x="130" y="90" text-anchor="middle">"Hey! can you call</text>
  <text class="t" x="130" y="110" text-anchor="middle">Alex from work</text>
  <text class="t" x="130" y="130" text-anchor="middle">for me?"</text>
  <path class="ar" d="M240 105 H280"/>
  <rect class="n bad" x="285" y="55" width="300" height="100" rx="10"/>
  <text class="t" x="420" y="88" text-anchor="middle">"Which Alex do you</text>
  <text class="t" x="420" y="108" text-anchor="middle">want to call?"</text>
  <text class="s" x="420" y="138" text-anchor="middle">redundant: only one Alex has a work number</text>
  <circle class="no" cx="560" cy="80" r="11"/><text x="560" y="85" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">x</text>
  <path class="ar" d="M585 105 H620"/>
  <rect class="n acc" x="625" y="55" width="255" height="100" rx="10"/>
  <text class="t" x="740" y="90" text-anchor="middle" font-weight="600">Call([Alex C. (Work)])</text>
  <text class="s" x="740" y="118" text-anchor="middle">domain has one entry,</text>
  <text class="s" x="740" y="136" text-anchor="middle">so it executes without asking</text>
  <circle class="ok" cx="856" cy="80" r="11"/><path d="M850 80 l4 4 l8 -8" fill="none" stroke="#fff" stroke-width="2.5"/>
  <!-- row 2 -->
  <rect class="n in" x="20" y="195" width="220" height="120" rx="10"/>
  <text class="t" x="130" y="228" text-anchor="middle">"Please ask Maya on</text>
  <text class="t" x="130" y="248" text-anchor="middle">text if she can pick</text>
  <text class="t" x="130" y="268" text-anchor="middle">the party supplies</text>
  <text class="t" x="130" y="288" text-anchor="middle">on Saturday?"</text>
  <path class="ar" d="M240 255 H280"/>
  <rect class="n bad" x="285" y="195" width="300" height="120" rx="10"/>
  <text class="t" x="420" y="228" text-anchor="middle">SMS([Maya S.], "Can you</text>
  <text class="t" x="420" y="248" text-anchor="middle">pick the party supplies</text>
  <text class="t" x="420" y="268" text-anchor="middle">on Saturday?")</text>
  <text class="s" x="420" y="298" text-anchor="middle">assumes the default number: her work phone</text>
  <circle class="no" cx="560" cy="220" r="11"/><text x="560" y="225" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">x</text>
  <path class="ar" d="M585 255 H620"/>
  <rect class="n acc" x="625" y="195" width="255" height="120" rx="10"/>
  <text class="t" x="740" y="238" text-anchor="middle" font-weight="600">"Should I text her on</text>
  <text class="t" x="740" y="258" text-anchor="middle" font-weight="600">her home phone?"</text>
  <text class="s" x="740" y="288" text-anchor="middle">two valid numbers, one question</text>
  <circle class="ok" cx="856" cy="220" r="11"/><path d="M850 220 l4 4 l8 -8" fill="none" stroke="#fff" stroke-width="2.5"/>
  <text class="s" x="450" y="340" text-anchor="middle">Same agent scaffold, same tools. The only change is where the uncertainty is represented.</text>
</svg>
<div class="fig-caption">The two examples from Figure 1 of the paper. Reasoning in token space asks when it should act and acts when it should ask. Reasoning over the tool's parameter domains gets both right.</div>
</div>

<div class="callout"><span class="callout-label">Key idea</span>Keep a probability distribution over candidate tool calls, factored over the tool and each argument's remaining domain. A clarifying question is worth asking only if a perfect answer would raise the probability of the best call (its Expected Value of Perfect Information, EVPI) by more than the cost of asking it.</div>

## Walkthrough: calling Alex, then texting Maya

The walkthrough traces both requests through SAGE-Agent (Structured Argument Uncertainty guided Elicitation Agent). The belief values are worked by hand from the paper's Equation 2 with the settings we used in the experiments, a redundancy penalty of $$ \lambda = 0.5 $$ and a stopping coefficient of $$ \alpha = 0.1 $$.

<div class="walkthrough" markdown="1">
<div class="wt-title">Walkthrough: "call Alex from work", then "text Maya"</div>
<div class="wt-step" data-label="Inputs" markdown="1">
<h4>1. The request, the contacts, and the tool schema</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three input boxes: the user request, the contacts list with Alex C. work, Alex M. home, and Maya S. work default and home, and the tool schema with Call(contact) and SMS(contact, message).">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .h { fill: currentColor; font-size: 15px; font-weight: 600; }
    .in { stroke: #2698BA; }
    .gr { stroke: currentColor; opacity: 0.55; }
    .mono { font-family: "Roboto Mono", Menlo, monospace; font-size: 13px; }
  </style>
  <rect class="n in" x="20" y="30" width="250" height="200" rx="10"/>
  <text class="h" x="145" y="60" text-anchor="middle" fill="#2698BA">User request</text>
  <text class="t" x="145" y="110" text-anchor="middle">"Hey! can you call</text>
  <text class="t" x="145" y="132" text-anchor="middle">Alex from work</text>
  <text class="t" x="145" y="154" text-anchor="middle">for me?"</text>
  <rect class="n in" x="310" y="30" width="270" height="200" rx="10"/>
  <text class="h" x="445" y="60" text-anchor="middle" fill="#2698BA">Contacts (the domain)</text>
  <text class="t" x="335" y="98">Alex C.</text><text class="s" x="440" y="98">Work  +1 202 XXXX</text>
  <text class="t" x="335" y="128">Alex M.</text><text class="s" x="440" y="128">Home  +1 231 XXXX</text>
  <text class="t" x="335" y="158">Maya S.</text><text class="s" x="440" y="158">Work  +1 XXX 2002</text>
  <text class="s" x="440" y="176" font-size="11">[default]</text>
  <text class="s" x="440" y="200">Home  +1 XXX 2703</text>
  <rect class="n gr" x="620" y="30" width="260" height="200" rx="10"/>
  <text class="h" x="750" y="60" text-anchor="middle">Tool schema</text>
  <text class="mono" x="640" y="98" fill="currentColor">Call(contact)</text>
  <text class="mono" x="640" y="128" fill="currentColor">SMS(contact, message)</text>
  <text class="s" x="640" y="162">contact: one entry from</text>
  <text class="s" x="640" y="180">the contacts list (finite)</text>
  <text class="s" x="640" y="204">message: free text</text>
</svg>
</div>

Everything the agent needs is already on the table. The request (blue) names a person and a label. The contacts list is the domain of the `contact` argument: a finite set of four phone entries. The tool schema (grey) says which arguments each tool takes and which are required. SAGE-Agent never reasons about ambiguity without this schema in view.

</div>
<div class="wt-step" data-label="Candidates" markdown="1">
<h4>2. Propose candidate tool calls with unknowns</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The LLM reads the request and emits a candidate call with an unknown contact argument; the words Alex and work act as constraints that shrink the contact domain from four entries to one.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .h { fill: currentColor; font-size: 15px; font-weight: 600; }
    .in { stroke: #2698BA; }
    .acc { stroke: #B509AC; }
    .ok { stroke: #00ab37; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    .mono { font-family: "Roboto Mono", Menlo, monospace; font-size: 13px; fill: currentColor; }
  </style>
  <rect class="n in" x="20" y="70" width="170" height="90" rx="10"/>
  <text class="t" x="105" y="105" text-anchor="middle">"call Alex from</text>
  <text class="t" x="105" y="125" text-anchor="middle">work for me?"</text>
  <path class="flow" d="M190 115 H235"/>
  <rect class="n" x="240" y="70" width="120" height="90" rx="10"/>
  <text class="h" x="300" y="110" text-anchor="middle">LLM</text>
  <text class="s" x="300" y="132" text-anchor="middle">reason</text>
  <path class="flow" d="M360 115 H405"/>
  <rect class="n acc" x="410" y="40" width="230" height="150" rx="10"/>
  <text class="h" x="525" y="68" text-anchor="middle" fill="#B509AC">Candidate call</text>
  <text class="mono" x="525" y="98" text-anchor="middle">Call(contact=&lt;UNK&gt;)</text>
  <text class="s" x="525" y="128" text-anchor="middle">constraints read from the query:</text>
  <text class="s" x="525" y="148" text-anchor="middle">name = Alex, label = Work</text>
  <text class="s" x="525" y="172" text-anchor="middle">tool prior: uniform over Call, SMS</text>
  <path class="flow" d="M640 115 H685"/>
  <rect class="n ok" x="690" y="40" width="190" height="150" rx="10"/>
  <text class="h" x="785" y="68" text-anchor="middle" fill="#00ab37">Remaining domain</text>
  <text class="s" x="785" y="98" text-anchor="middle">4 entries</text>
  <text class="s" x="785" y="118" text-anchor="middle">→ "Alex": 2 entries</text>
  <text class="s" x="785" y="138" text-anchor="middle">→ "work": 1 entry</text>
  <text class="t" x="785" y="170" text-anchor="middle" font-weight="600">{ Alex C. (Work) }</text>
  <text class="s" x="450" y="225" text-anchor="middle">an aspect = (tool, parameter). This candidate has one aspect: (Call, contact)</text>
</svg>
</div>

An LLM reads the request and the schema and proposes candidate tool calls, filling each argument with a value or `<UNK>`. What it says in the query becomes constraints on the argument's domain (the paper's `Update` operation), and the contact domain shrinks:

<div class="tok-row"><span class="tok tok-b">Alex C. Work</span><span class="tok tok-b">Alex M. Home</span><span class="tok tok-b">Maya S. Work</span><span class="tok tok-b">Maya S. Home</span><span class="tok-arrow">→ "Alex" →</span><span class="tok tok-b">Alex C. Work</span><span class="tok tok-b">Alex M. Home</span><span class="tok-arrow">→ "work" →</span><span class="tok tok-c tok-hl">Alex C. Work</span></div>

The word "call" also settles the tool. The paper uses a uniform prior over tools, so nothing forces `Call` over `SMS` a priori; it is the candidate generator that proposes only `Call` here.

</div>
<div class="wt-step" data-label="Belief" markdown="1">
<h4>3. Turn the domains into a belief over calls</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Belief table for the Alex request: the candidate Call with contact Alex C. Work has one aspect, a domain of size one, and belief 1.0, shown as a full green bar. A note contrasts specification uncertainty with model uncertainty.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .h { fill: currentColor; font-size: 15px; font-weight: 600; }
    .acc { stroke: #B509AC; }
    .bar { fill: #00ab37; opacity: 0.85; }
    .grid { stroke: currentColor; opacity: 0.25; }
    .mono { font-family: "Roboto Mono", Menlo, monospace; font-size: 13px; fill: currentColor; }
  </style>
  <rect class="n acc" x="20" y="25" width="860" height="140" rx="10"/>
  <text class="h" x="40" y="52" fill="#B509AC">Belief over candidate calls, π(c) ∝ p(tool) × Π p(argument)</text>
  <line class="grid" x1="40" y1="66" x2="860" y2="66"/>
  <text class="s" x="40" y="88">candidate</text>
  <text class="s" x="330" y="88">unresolved aspects</text>
  <text class="s" x="520" y="88">p(contact)</text>
  <text class="s" x="640" y="88">π(c)</text>
  <text class="mono" x="40" y="120">Call(contact = Alex C. (Work))</text>
  <text class="t" x="330" y="120">none (domain size 1)</text>
  <text class="t" x="520" y="120">1 / 1 = 1.0</text>
  <rect class="bar" x="640" y="106" width="200" height="18" rx="4"/>
  <text class="t" x="850" y="120" text-anchor="end" fill="#fff" font-weight="600">1.00</text>
  <text class="s" x="40" y="150">max π(c) = 1.0, at the ceiling: this already clears the execution threshold τ_exec</text>
  <text class="t" x="40" y="200" font-weight="600">Two kinds of uncertainty, kept apart</text>
  <text class="s" x="40" y="222">specification: the user has not said which entry (domain size &gt; 1)</text>
  <text class="s" x="480" y="222">model: the LLM is unsure how to read the request (lives in the LLM, not here)</text>
</svg>
</div>

Here is the move that makes the rest computable. A candidate with an unspecified argument is spread evenly over that argument's remaining domain, so its per-argument certainty is one over the domain size. For Alex, the domain has one entry, so `p(contact) = 1` and the belief in `Call([Alex C. (Work)])` is 1.0. Because the belief is defined over the schema and not over generated text, it measures what the user has left unsaid (specification uncertainty) separately from what the LLM might misread (model uncertainty).

</div>
<div class="wt-step" data-label="Score & decide" markdown="1">
<h4>4. Score the candidate question by EVPI minus cost, then decide not to ask</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Scoring the question Which Alex do you want to call: EVPI is one minus one equals zero, cost is zero, score zero is below the stopping bar, so SAGE-Agent executes Call Alex C. Work, while the token-space baseline asks the redundant question.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .h { fill: currentColor; font-size: 15px; font-weight: 600; }
    .acc { stroke: #B509AC; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .flowb { fill: none; stroke: #F29105; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
  <rect class="n acc" x="20" y="30" width="380" height="180" rx="10"/>
  <text class="h" x="210" y="58" text-anchor="middle" fill="#B509AC">Candidate question q</text>
  <text class="t" x="210" y="84" text-anchor="middle">"Which Alex do you want to call?"</text>
  <text class="s" x="210" y="104" text-anchor="middle">targets aspect (Call, contact), asked 0 times so far</text>
  <text class="t" x="40" y="138">EVPI(q) = E[max π after answer] − max π now = 1.0 − 1.0 = 0</text>
  <text class="t" x="40" y="162">Cost(q) = λ × n = 0.5 × 0 = 0</text>
  <text class="t" x="40" y="190" font-weight="600">Score(q) = 0 &lt; α × max π = 0.1 × 1.0 = 0.1 → stop asking</text>
  <path class="flow" d="M400 120 H455"/>
  <rect class="n ok" x="460" y="60" width="200" height="120" rx="10"/>
  <text class="h" x="560" y="92" text-anchor="middle" fill="#00ab37">SAGE-Agent executes</text>
  <text class="t" x="560" y="125" text-anchor="middle" font-weight="600">Call([Alex C. (Work)])</text>
  <text class="s" x="560" y="155" text-anchor="middle">0 questions asked</text>
  <path class="flowb" d="M660 120 H715"/>
  <rect class="n bad" x="720" y="60" width="160" height="120" rx="10"/>
  <text class="h" x="800" y="92" text-anchor="middle" fill="#F29105">Token-space baseline</text>
  <text class="t" x="800" y="118" text-anchor="middle">"Which Alex do</text>
  <text class="t" x="800" y="136" text-anchor="middle">you want to call?"</text>
  <text class="s" x="800" y="162" text-anchor="middle">redundant question</text>
  <text class="s" x="450" y="250" text-anchor="middle">EVPI simulates a perfect answer: how much would the best candidate's probability rise?</text>
  <text class="s" x="450" y="272" text-anchor="middle">A question whose answer cannot change the best call has EVPI = 0, whatever its wording.</text>
</svg>
</div>

The LLM also drafts candidate questions, each tagged with the candidate it targets and the aspects (tool, parameter pairs) it would resolve. For each one we simulate a perfect answer and ask how much the probability of the best candidate would rise in expectation. That is the question's EVPI. "Which Alex do you want to call?" targets `(Call, contact)`, whose domain is already a single entry, so the answer cannot move the belief and EVPI is exactly zero. The score falls below the stopping bar, so SAGE-Agent executes:

<div class="tok-row"><span class="tok tok-x tok-d">"Which Alex do you want to call?"</span><span class="tok-arrow">→</span><span class="tok tok-c">Call([Alex C. (Work)])</span></div>

</div>
<div class="wt-step" data-label="Second request" markdown="1">
<h4>5. "Text Maya": a domain of size two, so the agent asks</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="For the Maya request the candidate SMS call has a contact domain of two entries, work and home, each with belief 0.5. The question Should I text her on her home phone has EVPI 0.5 and cost 0, which is above the stopping bar of 0.05, so SAGE-Agent asks. The baseline sends to the default work number.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .h { fill: currentColor; font-size: 15px; font-weight: 600; }
    .in { stroke: #2698BA; }
    .acc { stroke: #B509AC; }
    .bad { stroke: #F29105; }
    .bar { fill: #2698BA; opacity: 0.8; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    .mono { font-family: "Roboto Mono", Menlo, monospace; font-size: 13px; fill: currentColor; }
  </style>
  <rect class="n in" x="20" y="30" width="200" height="120" rx="10"/>
  <text class="t" x="120" y="62" text-anchor="middle">"Please ask Maya on</text>
  <text class="t" x="120" y="82" text-anchor="middle">text if she can pick</text>
  <text class="t" x="120" y="102" text-anchor="middle">the party supplies</text>
  <text class="t" x="120" y="122" text-anchor="middle">on Saturday?"</text>
  <path class="flow" d="M220 90 H265"/>
  <rect class="n acc" x="270" y="30" width="330" height="120" rx="10"/>
  <text class="h" x="435" y="56" text-anchor="middle" fill="#B509AC">Candidate call and belief</text>
  <text class="mono" x="290" y="80">SMS(contact=&lt;UNK&gt;, message="Can you</text>
  <text class="mono" x="290" y="98">pick the party supplies on Saturday?")</text>
  <text class="s" x="290" y="120">contact domain: {Maya S. Work, Maya S. Home}</text>
  <text class="s" x="290" y="138">message: specified, p = 1</text>
  <rect class="n" x="640" y="30" width="240" height="120" rx="10"/>
  <text class="s" x="660" y="56">π over completions</text>
  <text class="t" x="660" y="84">Work</text><rect class="bar" x="720" y="72" width="70" height="16" rx="3"/><text class="t" x="800" y="84">0.50</text>
  <text class="t" x="660" y="112">Home</text><rect class="bar" x="720" y="100" width="70" height="16" rx="3"/><text class="t" x="800" y="112">0.50</text>
  <text class="s" x="660" y="138">max π = 0.5, below τ_exec</text>
  <rect class="n acc" x="20" y="180" width="580" height="130" rx="10"/>
  <text class="h" x="40" y="206" fill="#B509AC">Candidate question: "Should I text her on her home phone?"</text>
  <text class="s" x="40" y="226">targets aspect (SMS, contact), asked 0 times so far</text>
  <text class="t" x="40" y="254">EVPI = E[max π after answer] − max π now = 1.0 − 0.5 = 0.5</text>
  <text class="t" x="40" y="276">Cost = 0.5 × 0 = 0</text>
  <text class="t" x="40" y="298" font-weight="600">Score = 0.5 ≥ α × max π = 0.1 × 0.5 = 0.05 → ask</text>
  <rect class="n bad" x="640" y="180" width="240" height="130" rx="10"/>
  <text class="h" x="760" y="206" text-anchor="middle" fill="#F29105">Token-space baseline</text>
  <text class="t" x="760" y="236" text-anchor="middle">SMS([Maya S.], "...")</text>
  <text class="s" x="760" y="262" text-anchor="middle">picks the default number,</text>
  <text class="s" x="760" y="280" text-anchor="middle">which is her work phone</text>
</svg>
</div>

The follow-up request lands on the same machinery. "Maya" narrows the contact domain to two entries, and nothing in the request chooses between them, so the belief splits evenly:

<div class="tok-row"><span class="tok tok-b">Alex C. Work</span><span class="tok tok-b">Alex M. Home</span><span class="tok tok-b">Maya S. Work</span><span class="tok tok-b">Maya S. Home</span><span class="tok-arrow">→ "Maya" →</span><span class="tok tok-b tok-hl">Maya S. Work</span><span class="tok tok-b tok-hl">Maya S. Home</span></div>

Whichever way the user answers "Should I text her on her home phone?", the domain collapses to one entry and the best candidate's probability jumps from 0.5 to 1.0. That gives the question an EVPI of 0.5, far above the stopping bar, so this time SAGE-Agent asks. The token-space baseline, which never sees that the domain has two entries, sends the text to Maya's default number.

</div>
<div class="wt-step" data-label="Update & execute" markdown="1">
<h4>6. Fold the answer into the domain, then execute</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The user answers home. The contact domain is intersected with home, leaving Maya S. Home with belief 1.0; the aspect counter for SMS contact becomes 1; the agent executes SMS to Maya S. Home with the party supplies message.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .h { fill: currentColor; font-size: 15px; font-weight: 600; }
    .in { stroke: #2698BA; }
    .acc { stroke: #B509AC; }
    .ok { stroke: #00ab37; }
    .bar { fill: #00ab37; opacity: 0.85; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    .mono { font-family: "Roboto Mono", Menlo, monospace; font-size: 13px; fill: currentColor; }
  </style>
  <rect class="n in" x="20" y="60" width="150" height="100" rx="10"/>
  <text class="h" x="95" y="90" text-anchor="middle" fill="#2698BA">User answer</text>
  <text class="t" x="95" y="120" text-anchor="middle">"Yes, her</text>
  <text class="t" x="95" y="140" text-anchor="middle">home phone."</text>
  <path class="flow" d="M170 110 H215"/>
  <rect class="n acc" x="220" y="40" width="270" height="140" rx="10"/>
  <text class="h" x="355" y="68" text-anchor="middle" fill="#B509AC">Belief update</text>
  <text class="s" x="240" y="96">domain ← domain ∩ Update(answer)</text>
  <text class="s" x="240" y="116">{Work, Home} ∩ {Home} = {Home}</text>
  <text class="t" x="240" y="142">π(Home) = 1.0</text>
  <rect class="bar" x="340" y="130" width="130" height="16" rx="3"/>
  <text class="s" x="240" y="166">n(SMS, contact) ← 1</text>
  <path class="flow" d="M490 110 H535"/>
  <rect class="n ok" x="540" y="40" width="340" height="140" rx="10"/>
  <text class="h" x="710" y="68" text-anchor="middle" fill="#00ab37">Execute</text>
  <text class="mono" x="710" y="100" text-anchor="middle">SMS([Maya S. (Home)],</text>
  <text class="mono" x="710" y="118" text-anchor="middle">"Can you pick the party</text>
  <text class="mono" x="710" y="136" text-anchor="middle">supplies on Saturday?")</text>
  <text class="s" x="710" y="164" text-anchor="middle">1 question asked, correct number</text>
  <text class="s" x="450" y="220" text-anchor="middle">Asking about (SMS, contact) again would now cost λ × 1 = 0.5, so a repeat question is priced out.</text>
</svg>
</div>

The answer is not pasted into a prompt and forgotten. It becomes a constraint on the `contact` domain, the belief is recomputed, and the counter for the aspect `(SMS, contact)` goes up by one. Belief 1.0 clears the execution threshold, and the agent sends the text to the right number:

<div class="tok-row"><span class="tok tok-b">Maya S. Work</span><span class="tok tok-b">Maya S. Home</span><span class="tok-arrow">→ "home" →</span><span class="tok tok-x">Maya S. Work</span><span class="tok tok-c tok-hl">Maya S. Home</span><span class="tok-arrow">→</span><span class="tok tok-c">SMS([Maya S. (Home)], "...")</span></div>

If the tool call had failed at runtime, the agent would propose a corrected call or an error-specific question and re-enter the scoring step (step 4) rather than retrying blindly.

</div>
</div>

## Under the hood

The clarification loop is a sequential decision problem: at each turn the agent chooses between executing its best candidate and asking a question, with the user's true intent hidden. The paper frames this as a POMDP whose observations are user answers and whose belief state is a distribution over structured tool calls, and uses a Bayesian value-of-information objective to choose questions.

| Symbol | Meaning |
|---|---|
| $$ T_i = (name_i, \Theta_i, \mathcal{D}_i, \mathcal{R}_i) $$ | Tool schema: parameter set, per-parameter domains, required parameters |
| $$ c $$ | Candidate call: a partial assignment of a tool's parameters; unspecified ones are `<UNK>` |
| $$ \mathcal{C}_t, \mathcal{Q}_t $$ | Candidate calls and candidate questions proposed by the LLM at step $$ t $$ |
| $$ \pi_c(t) $$ | Belief that candidate $$ c $$ matches the user's intent after answers $$ r_{1:t} $$ |
| $$ \mathcal{D}_{c,j}(t) $$ | Remaining domain of parameter $$ j $$ of candidate $$ c $$ |
| $$ a = (T_i, \theta_j) $$ | An aspect: one parameter of one tool; $$ \mathcal{A}(q) $$ is the set a question targets |
| $$ n_a(t) $$ | How many times aspect $$ a $$ has been asked about |
| $$ \lambda, \alpha, \tau_{\mathrm{exec}}, \epsilon $$ | Redundancy penalty, stopping coefficient, execution threshold, certainty for continuous domains |
{: .notation}

**Belief.** With a uniform prior over tools and conditional independence across parameters, the belief in a candidate factors over its parameters:

$$
\pi_c(t) \propto \prod_{j=1}^{m_c} p(\theta_{c,j} \mid T_c, u, r_{1:t}),
\qquad
p(\theta_{c,j}) =
\begin{cases}
1 & \text{specified} \\
\lvert \mathcal{D}_{c,j}(t) \rvert^{-1} & \text{unspecified, finite domain} \\
\epsilon & \text{unspecified, continuous domain}
\end{cases}
$$

An answer $$ r_t $$ to question $$ q_t $$ updates each targeted domain by intersection, $$ \mathcal{D}_\theta(t+1) = \mathcal{D}_\theta(t) \cap \mathrm{Update}(\theta, r_t, q_t) $$, and the beliefs are renormalized. Answers can be explicit values, cross-parameter dependencies, or exclusions such as "not business class"; all three are domain constraints, which is what keeps the update exact.

**Value of a question.** The Expected Value of Perfect Information of $$ q $$ is the expected gain in best-candidate certainty if the aspects it targets were resolved perfectly:

$$
\mathrm{EVPI}(q, \mathcal{B}(t)) = \mathbb{E}_{r}\!\left[\max_c \pi_c(t \mid q, r)\right] - \max_c \pi_c(t).
$$

In practice we simulate the resolution directly: for each candidate, multiply $$ \pi_c(t) $$ by $$ \lvert \mathcal{D}_a \rvert $$ for every targeted aspect it leaves unspecified, then take the expected maximum. EVPI is non-negative, has diminishing returns over question sequences, and goes to zero as the belief concentrates, which is exactly what happened to "Which Alex?" in step 4.

**Cost, selection, stopping.** Asking about the same aspect twice is discouraged by a redundancy cost, and the agent picks the question with the best net score:

$$
q^*(t) = \arg\max_{q \in \mathcal{Q}_t}\Big[\mathrm{EVPI}(q, \mathcal{B}(t)) - \lambda \sum_{a \in \mathcal{A}(q)} n_a(t)\Big],
\qquad
\text{execute } c^*(t) \text{ if } \max_q \mathrm{Score}(q,t) < \alpha \cdot \max_c \pi_c(t).
$$

The agent also executes immediately when $$ \max_c \pi_c(t) \geq \tau_{\mathrm{exec}} $$, and stops after $$ n_s $$ steps. Because the stopping bar scales with the current best belief, the loop ends either because the belief has become confident or because no remaining question is worth its cost. In the experiments we set $$ \lambda = 0.5 $$, $$ \alpha = 0.1 $$, and $$ \epsilon = 10^{-4} $$.

<div class="fig-svg">
<svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SAGE-Agent loop inserted into the Reason stage: LLM proposes candidate calls, belief is computed over the schema, if belief clears the execution threshold the call runs, otherwise the LLM proposes questions which are scored by EVPI minus cost; a score below alpha times the best belief executes, otherwise the best question is asked, the answer updates the domains, and the loop repeats.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; }
    .h { fill: currentColor; font-size: 14px; font-weight: 600; }
    .in { stroke: #2698BA; }
    .acc { stroke: #B509AC; }
    .ok { stroke: #00ab37; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .ar { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.6; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
  <rect class="n in" x="20" y="95" width="120" height="70" rx="10"/>
  <text class="h" x="80" y="124" text-anchor="middle">Query u,</text>
  <text class="h" x="80" y="142" text-anchor="middle">history O_t</text>
  <path class="ar" d="M140 130 H175"/>
  <rect class="n" x="180" y="95" width="130" height="70" rx="10"/>
  <text class="h" x="245" y="118" text-anchor="middle">LLM: propose</text>
  <text class="h" x="245" y="136" text-anchor="middle">candidates C_t</text>
  <text class="s" x="245" y="154" text-anchor="middle">values or &lt;UNK&gt;</text>
  <path class="flow" d="M310 130 H345"/>
  <rect class="n acc" x="350" y="85" width="150" height="90" rx="10"/>
  <text class="h" x="425" y="112" text-anchor="middle" fill="#B509AC">Belief π_c(t)</text>
  <text class="s" x="425" y="132" text-anchor="middle">1 / |domain| per</text>
  <text class="s" x="425" y="148" text-anchor="middle">unspecified argument</text>
  <text class="s" x="425" y="166" text-anchor="middle">max π ≥ τ_exec ?</text>
  <path class="flow" d="M425 175 V220"/>
  <text class="s" x="440" y="200">yes</text>
  <path class="flow" d="M500 130 H545"/>
  <text class="s" x="522" y="120" text-anchor="middle">no</text>
  <rect class="n" x="550" y="95" width="130" height="70" rx="10"/>
  <text class="h" x="615" y="118" text-anchor="middle">LLM: propose</text>
  <text class="h" x="615" y="136" text-anchor="middle">questions Q_t</text>
  <text class="s" x="615" y="154" text-anchor="middle">with aspects A(q)</text>
  <path class="flow" d="M680 130 H715"/>
  <rect class="n acc" x="720" y="85" width="160" height="90" rx="10"/>
  <text class="h" x="800" y="112" text-anchor="middle" fill="#B509AC">Score questions</text>
  <text class="s" x="800" y="132" text-anchor="middle">EVPI(q) − λ Σ n_a</text>
  <text class="s" x="800" y="150" text-anchor="middle">best &lt; α · max π ?</text>
  <text class="s" x="800" y="166" text-anchor="middle">yes: execute</text>
  <path class="flow" d="M800 175 V220 H520"/>
  <rect class="n ok" x="360" y="220" width="160" height="50" rx="10"/>
  <text class="h" x="440" y="242" text-anchor="middle" fill="#00ab37">Execute c*(t)</text>
  <text class="s" x="440" y="260" text-anchor="middle">Act, then Observe</text>
  <path class="flow" d="M880 130 H895 V12 H245 V95"/>
  <rect class="n in" x="560" y="24" width="270" height="42" rx="10"/>
  <text class="t" x="695" y="42" text-anchor="middle">no: ask q*, answer r_t constrains domains,</text>
  <text class="s" x="695" y="59" text-anchor="middle">n_a += 1 for a in A(q*), back to Reason</text>
</svg>
<div class="fig-caption">SAGE-Agent's clarification loop sits inside the Reason stage of a Reason-Act-Observe agent. Purple boxes are the structured-uncertainty computations; the two LLM calls per turn are plain boxes.</div>
</div>

**The same belief as a training signal.** The certainty $$ \max_c \pi_c(t) $$ also makes a reward. In GRPO training on 9K When2Call examples, we multiply the action-classification reward by $$ \mathrm{Cert}(a_t) $$, which is $$ \max_c \pi_c(t) $$ for a tool call, $$ 1 - \max_c \pi_c(t) $$ for a clarifying question, and 1 otherwise, so confident correct calls get full payoff, low-certainty calls are penalized, and asking is rewarded only when uncertainty is high, with no critic to judge question quality.

**Where the evaluation comes from.** We built ClarifyBench to test this in multi-turn use: 716 tasks across document processing, vehicle control, stock trading, travel, and file systems, over 92 tools, with an LLM user simulator that holds the true intent, answers questions, and issues follow-up requests. Queries are split into explicit, ambiguous, and infeasible (which should be declined), and every generated query was checked by two annotators.

## What the numbers say

| Method (GPT-4o, ambiguous split) | Coverage | TMR | PMR | Avg. #Q |
|---|---|---|---|---|
| ReAct + `ask_question()` | 42.88 | 70.41 | 62.55 | 2.68 |
| ProCOT | 54.27 | 75.62 | 66.82 | 2.07 |
| Active Task Disambiguation | 45.60 | 77.10 | 60.78 | 3.42 |
| Domain-aware ReAct | 55.70 | 79.83 | 68.04 | 2.56 |
| SAGE-Agent, heuristic-based | 56.42 | 82.31 | 69.81 | 1.82 |
| **SAGE-Agent** | **59.73** | **86.02** | **71.79** | **1.39** |

Coverage counts tool calls that fully match the ground truth; TMR and PMR are tool and parameter match rates; #Q is the mean number of clarifying questions per task. Across baselines and both base models (GPT-4o and Qwen2.5-14B-Instruct), SAGE-Agent reaches 7-39% higher coverage on ambiguous tasks while asking 1.5-2.7x fewer questions. The heuristic row triggers questions on `<UNK>` alone without EVPI scoring, and gives up 1-3 points across metrics while asking 0.2-0.4 more questions, which is the value of steps 4 and 5 above. Raising $$ \lambda $$ from 0 to 0.5 cuts questions by 18.1% (ambiguous), 26.6% (explicit), and 24.2% (infeasible) with Coverage, TMR, and PMR within 3%, so the pruned questions were redundant. On the training side, certainty-weighted GRPO lifts When2Call accuracy from 36.5% to 65.2% for Qwen2.5-3B and from 36.7% to 62.9% for Qwen2.5-7B; the 3B model with our reward beats the 7B model with the standard reward (45.1%).

## Try it

- Paper page: [/papers/sage-clarification/](/papers/sage-clarification/)
- arXiv: [2511.08798](https://arxiv.org/abs/2511.08798)
- Code and benchmark: [github.com/MananSuri27/ClarifyBench](https://github.com/MananSuri27/ClarifyBench)
- ACL Anthology: [2026.findings-acl.2028](https://aclanthology.org/2026.findings-acl.2028/)
