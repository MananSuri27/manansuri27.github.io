---
layout: paper
title: "Structured Uncertainty Guided Clarification for LLM Agents"
short_title: "SAGE-Agent / ClarifyBench"
description: "SAGE-Agent picks clarifying questions by expected value of information over tool parameters: 7-39% higher coverage, 1.5-2.7x fewer questions. ACL 2026 Findings."
bibkey: suri-etal-2026-clarification
authors:
  - name: Manan Suri
    url: /
    me: true
  - name: Puneet Mathur
    url: https://research.adobe.com/person/puneet-mathur/
  - name: Nedim Lipka
    url: https://research.adobe.com/person/nedim-lipka/
  - name: Franck Dernoncourt
    url: https://research.adobe.com/person/franck-dernoncourt/
  - name: Ryan A. Rossi
    url: https://ryanrossi.com/
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park; Adobe Research"
venue: "Findings of ACL 2026"
venue_short: "ACL 2026 Findings"
year: 2026
date: 2025-11-11
arxiv: "2511.08798"
pdf: https://arxiv.org/pdf/2511.08798
publisher_url: https://aclanthology.org/2026.findings-acl.2028/
publisher_label: "ACL Anthology"
code: https://github.com/MananSuri27/ClarifyBench
dataset: https://github.com/MananSuri27/ClarifyBench
hf_paper: https://huggingface.co/papers/2511.08798
blog: /blog/2026/sage-clarification-explained/
figure: /assets/img/papers/sage-clarification/hero.png
figure_alt: "SAGE-Agent flow: an LLM reasons over a user query to produce candidate tool calls with unknown parameters, uncertainty is quantified over the tool schema, candidate clarifying questions are scored by expected value of perfect information minus a redundancy cost, and the agent either asks the best question or executes the tool."
figure_caption: "SAGE-Agent. An LLM proposes candidate tool calls with possibly unknown parameters (1). Structured uncertainty over the tool schema decides whether clarification is needed (2). Candidate questions are generated (3) and scored by cost-penalized Expected Value of Perfect Information (4). The user's answer constrains parameter domains (5), and once uncertainty is low the best tool call is executed (6)."
tldr: "Tool-calling agents fail on ambiguous instructions, and prompting-based clarification has no principled way to decide which question to ask or when to stop. We model uncertainty directly over tool parameters and their domains, score questions by expected value of perfect information minus a redundancy cost, and get 7-39% higher coverage on ambiguous tasks with 1.5-2.7x fewer questions, plus a 36.5% to 65.2% jump in When2Call accuracy when the same signal is used as an RL reward."
highlights:
  - value: "7-39%"
    label: "higher coverage on ambiguous tasks vs. baselines"
  - value: "1.5-2.7x"
    label: "fewer clarification questions"
  - value: "36.5% to 65.2%"
    label: "When2Call accuracy, 3B model, with uncertainty-weighted GRPO"
  - value: "716"
    label: "ClarifyBench tasks across 5 domains and 92 tools"
og_image: https://manansuri.com/assets/img/papers/sage-clarification/hero.png
---

## Abstract

LLM agents with tool-calling capabilities often fail when user instructions are ambiguous or incomplete, leading to incorrect invocations and task failures. Existing approaches operate in unstructured language spaces, generating clarifying questions through prompting strategies that lack principled criteria for determining which questions to ask and when to stop. We introduce a principled formulation of structured uncertainty that operates directly over tool parameters and their domains, cleanly separating specification uncertainty (what the user wants) from model uncertainty (what the LLM predicts). Our formulation uses Expected Value of Perfect Information (EVPI) to quantify the disambiguation value of each potential question, balanced against aspect-based cost modeling that prevents redundant questioning. We demonstrate the versatility of this formulation through two applications. First, SAGE-Agent uses structured uncertainty for inference-time question selection, achieving 7-39% higher coverage on ambiguous tasks while reducing clarification questions by 1.5-2.7x compared to strong prompting and uncertainty-based baselines. Second, we show that structured uncertainty provides effective training signals: uncertainty-guided reward modeling boosts When2Call accuracy from 36.5% to 65.2% (3B model) and 36.7% to 62.9% (7B model) through uncertainty-weighted GRPO training, demonstrating more sample-efficient reinforcement learning for tool-calling agents. To enable evaluation, we present ClarifyBench, the first multi-turn dynamic tool-calling disambiguation benchmark. Our results establish structured uncertainty as a principled framework that improves both inference-time interaction efficiency and training-time sample efficiency in tool-augmented agents.

## The problem

A single ambiguous request such as "cancel my subscription" maps to several valid API calls with very different consequences: which service, pause or permanent, effective when. Agents trained on next-token prediction tend to hallucinate the missing arguments rather than ask. Existing clarification methods generate questions as free text through prompting, so they have no explicit model of which parameters are missing, how much each one matters, or whether a question has already been answered. The result is over-clarification of low-impact details, under-clarification of critical ones, and no way to tell a feasible request from an infeasible one.

There was also no benchmark for this setting. Prior tool-calling benchmarks either lack ambiguous and infeasible queries or evaluate statically, without a user who answers questions and then continues the conversation.

## Approach

We move disambiguation out of token space and into the space of tool parameters and their domains.

- **Structured belief state.** Each tool schema defines parameters, their domains, and which are required. Candidate tool calls may leave parameters unspecified (`<UNK>`). The agent keeps a belief distribution over candidates, factored over tool choice and per-parameter certainty. This separates specification uncertainty (what the user wants) from model uncertainty (what the LLM predicts).
- **Expected Value of Perfect Information (EVPI).** For each candidate clarifying question we compute how much perfectly resolving its target aspects would raise the probability of the best candidate. User answers are treated as constraints on parameter domains, so belief updates are exact and EVPI is tractable.
- **Aspect-based redundancy cost.** An aspect is one parameter of one tool. Each question targets a set of aspects, and the cost grows with how many times those aspects have already been queried, with a penalty strength lambda. The agent asks the question with the highest EVPI minus cost and stops when the best net gain falls below a threshold.
- **SAGE-Agent** (Structured Argument Uncertainty guided Elicitation Agent) inserts this loop into the Reason stage of a standard Reason-Act-Observe agent. If a tool call fails at runtime, the agent generates a corrected invocation or an error-specific question and re-enters the scoring step.
- **Uncertainty-guided reward modeling.** The same belief gives a training signal. In GRPO training on 9K When2Call examples, a certainty-weighted reward up-weights confident correct tool calls, penalizes low-certainty calls, and rewards clarification only when uncertainty is high. It needs no critic to judge question quality.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SAGE-Agent loop: a user request becomes candidate tool calls with unknown parameters, uncertainty is measured over the tool schema, candidate questions are scored by EVPI minus a redundancy cost, the best question is asked and the answer narrows the parameter domains until a confident tool call is executed.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.75; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    .fade2 { animation: fade 4s ease-in-out infinite; animation-delay: -2s; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <!-- 1 request -->
  <rect class="n" x="20" y="100" width="140" height="90" rx="10"/>
  <text class="t" x="90" y="128" text-anchor="middle" font-weight="600">User request</text>
  <text class="s" x="90" y="150" text-anchor="middle">"call Alex</text>
  <text class="s" x="90" y="168" text-anchor="middle">from work"</text>
  <path class="flow" d="M160 145 H205"/>
  <!-- 2 candidates -->
  <rect class="n acc" x="210" y="85" width="160" height="120" rx="10"/>
  <text class="t" x="290" y="112" text-anchor="middle" font-weight="600">Candidate calls</text>
  <text class="s" x="290" y="134" text-anchor="middle">call(contact=&lt;UNK&gt;)</text>
  <text class="s" x="290" y="152" text-anchor="middle">belief over tool</text>
  <text class="s" x="290" y="170" text-anchor="middle">and per-parameter</text>
  <text class="s" x="290" y="188" text-anchor="middle">domains</text>
  <path class="flow" d="M370 145 H415" style="animation-delay:.3s"/>
  <!-- 3 uncertainty -->
  <rect class="n acc" x="420" y="85" width="150" height="120" rx="10"/>
  <text class="t" x="495" y="112" text-anchor="middle" font-weight="600">Uncertainty</text>
  <text class="s" x="495" y="134" text-anchor="middle">specification vs</text>
  <text class="s" x="495" y="152" text-anchor="middle">model uncertainty</text>
  <g class="pulse"><rect class="n acc" x="440" y="165" width="30" height="24" rx="3"/><rect class="n" x="480" y="165" width="30" height="24" rx="3"/><rect class="n" x="520" y="165" width="30" height="24" rx="3"/></g>
  <text class="s" x="495" y="200" text-anchor="middle" font-size="10">unresolved aspect</text>
  <path class="flow" d="M570 145 H615" style="animation-delay:.6s"/>
  <!-- 4 question selection -->
  <rect class="n acc" x="620" y="85" width="160" height="120" rx="10"/>
  <text class="t" x="700" y="112" text-anchor="middle" font-weight="600">Select question</text>
  <text class="s" x="700" y="134" text-anchor="middle">score = EVPI</text>
  <text class="s" x="700" y="152" text-anchor="middle">- lambda x cost</text>
  <text class="s" x="700" y="170" text-anchor="middle">cost grows if the</text>
  <text class="s" x="700" y="188" text-anchor="middle">aspect was asked</text>
  <!-- branch: ask (loop back) or execute -->
  <path class="flow" d="M780 145 H825" style="animation-delay:.9s"/>
  <rect class="n" x="830" y="110" width="60" height="70" rx="10"/>
  <text class="t" x="860" y="140" text-anchor="middle" font-weight="600">Tool</text>
  <text class="t" x="860" y="158" text-anchor="middle" font-weight="600">call</text>
  <text class="s" x="860" y="200" text-anchor="middle">if gain &lt;</text>
  <text class="s" x="860" y="216" text-anchor="middle">threshold</text>
  <!-- loop back: ask question, answer constrains domains -->
  <path class="flow" d="M700 205 V260 H615" style="animation-delay:1.2s"/>
  <path class="flow" d="M375 260 H290 V205" style="animation-delay:1.5s"/>
  <g class="fade1"><rect class="n" x="380" y="240" width="230" height="40" rx="8"/>
    <text class="s" x="495" y="256" text-anchor="middle">Ask best question:</text>
    <text class="s" x="495" y="272" text-anchor="middle">"Should I text her home phone?"</text></g>
  <g class="fade2"><rect class="n" x="380" y="240" width="230" height="40" rx="8"/>
    <text class="s" x="495" y="256" text-anchor="middle">Answer constrains domain:</text>
    <text class="s" x="495" y="272" text-anchor="middle">phone in {home}, belief updated</text></g>
  <text class="s" x="495" y="305" text-anchor="middle">repeat until the best net gain falls below a threshold</text>
  <text class="s" x="290" y="60" text-anchor="middle">tool schema: parameters, domains, required</text>
</svg>
<div class="anim-caption">SAGE-Agent: candidate tool calls with unknown parameters are scored for uncertainty over the tool schema; questions are ranked by EVPI minus a redundancy cost, and each answer narrows the parameter domains until the agent can call the tool with confidence.</div>
</div>

**ClarifyBench.** We build a multi-turn benchmark with an LLM-based user simulator that holds the true intent, answers clarifying questions, and issues follow-up requests. Sources are DocPilot tool logs and BFCL-v3, augmented by obfuscating up to three arguments and prompting GPT-4o to generate queries that omit them, or by rule-based corruption for infeasible cases. Two annotators rate every generated query on naturalness, faithfulness, and (for infeasible cases) the presence of an error-inducing requirement.

| | Doc | Vehicle | Stocks | Travel | Files | All |
|---|---|---|---|---|---|---|
| Total samples | 181 | 139 | 143 | 119 | 134 | 716 |
| Number of tools | 18 | 22 | 19 | 15 | 18 | 92 |
| Avg. # of tool calls | 3.9 | 4.5 | 3.9 | 3.7 | 3.1 | 3.8 |
| Explicit queries | 49 | 50 | 49 | 50 | 43 | 241 |
| Ambiguous queries | 49 | 39 | 46 | 40 | 39 | 213 |
| Infeasible queries | 48 | 49 | 38 | 18 | 45 | 198 |
| Avg. # of follow-ups | 2.9 | 2.1 | 2.7 | 2.3 | 1.8 | 2.4 |

<p class="table-note">Source: Table 2 of the paper. ClarifyBench statistics per domain (document processing, vehicle control, stock trading, travel, file system).</p>

## Example

The paper's Figure 1 contrasts clarification in token space with clarification grounded in the tool's parameter domains. The agent has a contacts list with Alex C. (work number), Alex M. (home number), and Maya S. (default: work number; also a home number).

<div class="paper-example" markdown="1">
<span class="ex-label">Input</span>
<div class="ex-row">"Hey! can you call Alex from work for me?"</div>
<span class="ex-label">Token-space clarification</span>
<div class="ex-row"><span class="ex-bad">"Which Alex do you want to call?"</span> Redundant question, since only one Alex has a work number.</div>
<span class="ex-label">Domain-space clarification (SAGE-Agent)</span>
<div class="ex-row"><span class="ex-good"><code>Call([Alex C. (Work)])</code></span> The answer is fully determined by the parameter domain, so the agent executes directly.</div>
</div>

<div class="paper-example" markdown="1">
<span class="ex-label">Input</span>
<div class="ex-row">"Please ask Maya on text if she can pick the party supplies on Saturday?"</div>
<span class="ex-label">Token-space clarification</span>
<div class="ex-row"><span class="ex-bad"><code>SMS([Maya S.], "Can you pick the party supplies on Saturday?")</code></span> Assumes the default phone number for Maya, which in this case turns out to be her work contact.</div>
<span class="ex-label">Domain-space clarification (SAGE-Agent)</span>
<div class="ex-row"><span class="ex-good">"Should I text her on her home phone?"</span> The phone-number parameter has two valid values, so the agent asks the one question that resolves it.</div>
</div>

{% include figure.html path="assets/img/papers/sage-clarification/fig-intro.png" class="img-fluid rounded" zoomable=true caption="The two examples as drawn in the paper's Figure 1. Left: token-space clarification asks a redundant question or silently assumes a default. Right: grounding the decision in the tool's parameter domains executes directly when the answer is determined and asks only when it is not." %}

A ClarifyBench task (from the released benchmark, ambiguous split, vehicle-control domain). The user simulator holds the intention and reveals the missing value only when asked; it then issues the follow-up request.

<div class="paper-example" markdown="1">
<span class="ex-label">User query</span>
<div class="ex-row">"Would you be able to convert some liters of gasoline into gallons volumn for me? Afterwards, starting the engine to check for smooth operation would be appreciated."</div>
<span class="ex-label">Hidden user intention (seen only by the simulator)</span>
<div class="ex-row">"If asked, user clarifies that this is 'I mean 20 liters of gas.' Thereafter, user requests to start the engine to check for smooth operation."</div>
<span class="ex-label">Ground-truth tool calls</span>
<div class="ex-row" markdown="1">

```json
[{"tool_name": "liter_to_gallon", "parameters": {"liter": "20.0"}},
 {"tool_name": "startEngine",     "parameters": {"ignitionMode": "START"}}]
```

</div>
</div>

## Results

Metrics on ClarifyBench: Coverage (tool call fully matches ground truth), Tool Match Rate (TMR), Parameter Match Rate (PMR), and average number of questions (#Q). Baselines share a common ReAct scaffold: ReAct with an `ask_question()` tool, ProCOT, Active Task Disambiguation, and Domain-aware ReAct (schema in context).

| Method (GPT-4o, ambiguous split) | Coverage | TMR | PMR | Avg. #Q |
|---|---|---|---|---|
| ReAct + `ask_question()` | 42.88 | 70.41 | 62.55 | 2.68 |
| ProCOT | 54.27 | 75.62 | 66.82 | 2.07 |
| Active Task Disambiguation | 45.60 | 77.10 | 60.78 | 3.42 |
| Domain-aware ReAct | 55.70 | 79.83 | 68.04 | 2.56 |
| SAGE-Agent, heuristic-based | 56.42 | 82.31 | 69.81 | 1.82 |
| **SAGE-Agent** | **59.73** | **86.02** | **71.79** | **1.39** |

<p class="table-note">Source: Table 3 of the paper, GPT-4o rows for the ClarifyBench ambiguous split. Coverage, TMR, and PMR in %, higher is better; Avg. #Q is the mean number of clarifying questions per task, lower is better.</p>

- SAGE-Agent asks 1.39 questions per ambiguous task, versus 2.56 (Domain-aware ReAct), 2.68 (ReAct), and 3.42 (Active Task Disambiguation), and 1.08 on explicit tasks.
- On infeasible tasks it reaches 67.33% Coverage and 92.89% TMR, ahead of all baselines; on explicit tasks 71.67% Coverage with 1.08 questions.
- Active Task Disambiguation needs roughly 24K tokens and 40 LLM calls per task to compute entropy over question-by-solution matrices. SAGE-Agent uses about 22K tokens with 54% fewer calls, because it parametrizes uncertainty over the schema instead of sampling solutions.
- With Qwen2.5-14B-Instruct the pattern holds: 54.56% Coverage on ambiguous tasks versus 52.45% (ProCOT) and 51.10% (Domain-aware ReAct), with questions reduced to 1.41 from 2.07.
- Ablation: triggering questions on `<UNK>` tokens alone, without EVPI scoring, costs 1 to 3 points across metrics and adds 0.2 to 0.4 questions per task.
- Raising the redundancy penalty lambda from 0 to 0.5 cuts questions by 18.1% (ambiguous), 26.6% (explicit), and 24.2% (infeasible) while Coverage, TMR, and PMR stay within 3%, confirming the pruned questions were redundant.

**Single-turn When2Call (BFCLv2).** Each example has one correct action: call the tool, ask a question, or decline.

| Method (GPT-4o) | ToolCall P | ToolCall F1 | AskQuestion F1 | Decline F1 |
|---|---|---|---|---|
| ReAct | 0.71 | 0.75 | 0.64 | 0.69 |
| Active Task Disambiguation | 0.61 | 0.34 | 0.56 | 0.73 |
| **SAGE-Agent** | **0.80** | **0.65** | **0.65** | **0.78** |

<p class="table-note">Source: Table 4 of the paper, GPT-4o rows. Precision (P) and F1 per action class. Higher is better.</p>

- SAGE-Agent has the best balance across the three actions: ReAct over-calls tools (ToolCall recall 0.79 but Decline recall 0.58), and Active Task Disambiguation over-asks (ToolCall recall 0.24).
- Reward modeling: uncertainty-weighted GRPO lifts When2Call accuracy from 36.5% to 65.2% (Qwen2.5-3B) and 36.7% to 62.9% (Qwen2.5-7B). The 3B model with our reward (65.2%) beats the 7B model with the standard reward (45.1%).

## Resources

- [arXiv: 2511.08798](https://arxiv.org/abs/2511.08798)
- [ACL Anthology (Findings of ACL 2026)](https://aclanthology.org/2026.findings-acl.2028/)
- [Code, evaluation harness, and ClarifyBench benchmark on GitHub](https://github.com/MananSuri27/ClarifyBench)
- [Hugging Face Papers](https://huggingface.co/papers/2511.08798)
- [Adobe Research publication page](https://research.adobe.com/publication/structured-uncertainty-guided-clarification-for-llm-agents/)
- [Explainer post: SAGE-Agent and ClarifyBench](/blog/2026/sage-clarification-explained/)
- Related on this site: [CodeScout](/papers/codescout/), which resolves underspecified requests for software agents by pre-exploring the repository
- [All publications](/publications/)

### Quick start

From the repository README: run the baseline ReAct agent on the ambiguous split with any OpenAI-compatible endpoint, then score the results.

```bash
git clone https://github.com/MananSuri27/ClarifyBench.git
cd ClarifyBench
pip install -r requirements.txt

export OPENAI_API_KEY="sk-..."           # or VLLM_PORT=8000 for a local vLLM server
python main.py --agent baseline --data ClarifyBench/ClarifyBench_A/ --output results/
python evaluate.py --results_dir results/ --gt_dir ClarifyBench/ClarifyBench_A/
```

The benchmark ships as JSON tasks under `ClarifyBench/ClarifyBench_E`, `ClarifyBench_A`, and `ClarifyBench_I` (explicit, ambiguous, infeasible), each with `user_query`, `potential_follow_ups`, `ground_truth_tool_calls`, `user_intention`, and an `initial_config` for the domain plugin.
