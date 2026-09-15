---
layout: post
title: "Ask fewer, better questions: SAGE-Agent and ClarifyBench explained"
description: "How modeling uncertainty over tool parameters, not tokens, lets an LLM agent decide which clarifying question to ask and when to stop asking."
date: 2026-09-14 12:00:00
tags: agents tool-use clarification uncertainty
categories: research
thumbnail: assets/img/papers/sage-clarification/hero.png
related_posts: false
toc:
  beginning: true
---

Ask an assistant to "text Maya and see if she can pick up the party supplies on Saturday" and it has a choice to make. Maya has a work number and a home number. Send to the default and you may have just messaged her office on a weekend. Ask "which number?" every time and the assistant becomes tedious. Tool-calling agents face this trade-off on every request and often get it wrong in both directions: they hallucinate the missing argument, or they ask about things the schema already settles.

Our ACL 2026 Findings paper, [Structured Uncertainty Guided Clarification for LLM Agents](/papers/sage-clarification/), argues that the mistake is where the uncertainty lives. Existing methods reason about ambiguity in token space, by prompting the model to write a clarifying question as free text. We move it into the space of tool parameters and their domains, and the decision becomes something you can compute.

## The idea

Every tool has a schema: a set of parameters, the domain each one can take, and which are required. A candidate tool call is a partial assignment of those parameters, with some marked unknown. If the agent keeps a probability distribution over candidate calls, then "how uncertain am I?" has a precise meaning, and so does "how much would this question help?"

That second quantity is the Expected Value of Perfect Information (EVPI), an old idea from Bayesian decision theory. For a candidate question, imagine the user answers it perfectly: how much does the probability of the best candidate call rise in expectation? That is the value of asking. We subtract a cost that grows each time the question touches an aspect (one parameter of one tool) that has already been queried. Ask the question with the highest net value; when that drops below a threshold, stop and execute.

Two things fall out of this. First, the agent separates specification uncertainty (the user has not said) from model uncertainty (the LLM is unsure), because the belief is defined over the schema rather than over generated text. Second, questions whose answers cannot change the best tool call have zero EVPI, so the "which Alex?" question from the figure below never gets asked when only one Alex has a work number.

## How it works

{% include figure.html path="assets/img/papers/sage-clarification/hero.png" class="img-fluid rounded z-depth-1" zoomable=true caption="SAGE-Agent inserts a structured clarification loop into the Reason stage of a standard Reason-Act-Observe agent. Candidate tool calls with unknown parameters are scored for uncertainty; if it is high, candidate questions are scored by EVPI minus a redundancy cost, and the agent asks or executes based on a dynamic threshold." %}

SAGE-Agent (Structured Argument Uncertainty guided Elicitation Agent) runs in five steps.

1. **Candidate generation.** An LLM reads the query and observation history and proposes candidate tool calls, filling each parameter with a value or `<UNK>`. Belief over candidates comes from a uniform tool prior and per-parameter certainty, which falls with the size of an unspecified parameter's domain.
2. **Question generation.** If the best candidate is not confident enough, the LLM drafts candidate questions, each tagged with the candidate it targets and the aspects it would resolve.
3. **Scoring and selection.** For each question, we simulate perfect resolution of its aspects and compute EVPI, subtract the redundancy cost, and pick the maximum. If that maximum is below the stopping threshold, execute the best call instead.
4. **Belief update.** The user's answer becomes constraints on parameter domains: explicit values, cross-parameter dependencies, or exclusions such as "not business class". Beliefs are renormalized and aspect counters incremented.
5. **Termination and error recovery.** The loop ends on high confidence, low question value, or a step cap. If a call fails at runtime, the agent proposes a corrected call or an error-specific question and re-enters scoring.

We needed somewhere to evaluate this, so we also built **ClarifyBench**: 716 multi-turn tasks across document processing, vehicle control, stock trading, travel, and file systems, using 92 tools. An LLM-based user simulator holds the true intent, answers questions, and issues follow-up requests. Tasks are split into explicit, ambiguous, and infeasible queries, the last of which should be declined rather than executed, and every generated query was checked by two annotators.

## What we found

- On ambiguous tasks with GPT-4o, SAGE-Agent reaches 59.73% Coverage (a fully correct tool call) versus 55.70% for the strongest baseline, Domain-aware ReAct, and does it with 1.39 questions per task instead of 2.56 to 3.42.
- Across baselines and both base models, that works out to 7-39% higher coverage on ambiguous tasks with 1.5-2.7x fewer questions.
- Active Task Disambiguation, the closest uncertainty-based method, needs about 24K tokens and 40 LLM calls per task because it estimates entropy over sampled solutions. SAGE-Agent uses about 22K tokens with 54% fewer calls.
- The same belief works as a training signal. Weighting a GRPO reward by certainty lifts When2Call accuracy from 36.5% to 65.2% for Qwen2.5-3B and from 36.7% to 62.9% for Qwen2.5-7B. The 3B model with our reward beats the 7B model trained with the standard reward (45.1%).

## Try it

- Paper page: [/papers/sage-clarification/](/papers/sage-clarification/)
- arXiv: [2511.08798](https://arxiv.org/abs/2511.08798)
- Code and benchmark: [github.com/MananSuri27/ClarifyBench](https://github.com/MananSuri27/ClarifyBench)
- ACL Anthology: [2026.findings-acl.2028](https://aclanthology.org/2026.findings-acl.2028/)
