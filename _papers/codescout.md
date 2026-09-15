---
layout: paper
title: "CodeScout: Contextual Problem Statement Enhancement for Software Agents"
short_title: "CodeScout"
description: "CodeScout rewrites vague issues into repository-aware problem statements before the agent runs, lifting SWE-bench Verified resolution by 20%. ACL 2026 Findings."
bibkey: suri-etal-2026-codescout
authors:
  - name: Manan Suri
    url: /
    me: true
  - name: Xiangci Li
  - name: Mehdi Shojaie
  - name: Songyang Han
  - name: Chao-Chun Hsu
  - name: Shweta Garg
  - name: Aniket Anand Deshmukh
  - name: Varun Kumar
affiliations: "University of Maryland, College Park; Amazon Web Services"
venue: "Findings of ACL 2026"
venue_short: "ACL 2026 Findings"
year: 2026
date: 2026-03-05
arxiv: "2603.05744"
pdf: https://arxiv.org/pdf/2603.05744
publisher_url: https://aclanthology.org/2026.findings-acl.2032/
publisher_label: "ACL Anthology"
figure: /assets/img/papers/codescout/hero.png
figure_alt: "The three-stage CodeScout pipeline: high-level context scoping over a repository graph, fine-grained context analysis with relevance scoring, and problem synthesis into a well-specified problem statement."
figure_caption: "CodeScout pre-explores the repository before the agent starts. A repository knowledge graph feeds (1) High Level Scoping, which picks exploration targets, (2) Fine-grained Context Analysis, which scores each target for relevance and extracts insights, and (3) Problem Synthesis, which rewrites the original issue into a well-specified problem statement."
tldr: "Software agents often fail not because the model cannot reason but because the issue they are handed is underspecified, which leads to over-exploration and repeated fix attempts. CodeScout rewrites the issue into a repository-aware, actionable problem statement before the agent runs, improving SWE-bench Verified resolution rates by 20% with up to 27 additional issues resolved, without touching the agent scaffold."
highlights:
  - value: "20%"
    label: "higher resolution rate on SWE-bench Verified"
  - value: "+27"
    label: "additional issues resolved vs. the default baseline"
  - value: "+51.9%"
    label: "for DeepSeek R1 agents when a stronger model writes the problem statement"
  - value: "~9"
    label: "LLM calls per problem statement to run CodeScout"
og_image: https://manansuri.com/assets/img/papers/codescout/hero.png
---

## Abstract

Current AI-powered code assistance tools often struggle with poorly-defined problem statements that lack sufficient task context and requirements specification. Recent analysis of software engineering agents reveals that failures on such underspecified requests are highly correlated with longer trajectories involving either over-exploration or repeated attempts at applying the same fix without proper evolution or testing, leading to suboptimal outcomes across software development tasks. We introduce CodeScout, a contextual query refinement approach that systematically converts underspecified user requests into comprehensive, actionable problem statements through lightweight pre-exploration of the target codebase. Our key innovation is demonstrating that structured analysis before task execution can supplement existing agentic capabilities without requiring any modifications to their underlying scaffolds. CodeScout performs targeted context scoping, conducts multi-perspective analysis examining potential fixes and exploration opportunities, then synthesizes these insights into enhanced problem statements with reproduction steps, expected behaviors, and targeted exploration hints. This pre-exploration directly addresses the identified failure patterns by reducing non-converging agent trajectories while clarifying user intent in natural language space. We evaluate CodeScout using state-of-the-art agentic scaffolds and language models on SWE-bench Verified, demonstrating a 20% improvement in resolution rates with up to 27 additional issues resolved compared to the default baseline method. Our results suggest that systematic query refinement through contextual analysis represents a promising direction for enhancing AI code assistance capabilities.

## The problem

Developers write short, context-dependent issue reports. They skip reproduction steps, technical details, and clear expectations because they assume the reader already knows the codebase. LLM-based software agents are the opposite: they work best with explicit, well-scoped specifications. Prior studies found that resolvable bug reports have far higher description quality than unresolvable ones, and that agent failures follow two recognizable patterns: over-exploration, where the agent never reaches the root cause, and repeatedly applying the same fix without testing or evolving it.

We argue that agents should look before they leap. Instead of asking the agent to discover the codebase incrementally inside its reason-execute-observe loop, we invest a small amount of computation up front to build a comprehensive picture of the problem. Figure 1 in the paper shows the effect on a Django issue: the original problem statement leads to 21 steps of unfocused exploration and failure, while the enhanced statement resolves the issue in 6 steps.

## Approach

CodeScout is a plug-and-play preprocessing step. It takes the original problem statement and the repository and produces an augmented specification, with no changes to the downstream agent.

- **Repository Knowledge Graph Construction.** An AST visitor parses the repository into a directed graph whose vertices are code entities (classes, functions, imports, variables) and whose edges capture inheritance, import and module relationships.
- **High Level Scoping.** Given the problem statement and the repository graph, an LLM agent proposes 5 to 10 exploration targets (files, classes, functions), each with a reason for its relevance. Retrieval happens directly from the graph, so this stage does not need full source access.
- **Fine-grained Context Analysis.** For each target, the source is retrieved and analyzed for its role in the issue, fix location hints with confidence estimates, technical insights, and alternative hypotheses. The LLM also assigns a relevance score, and only targets above a threshold survive.
- **Problem Synthesis.** An LLM combines the original statement with the filtered insights into a structured document: an enhanced issue description, reproduction steps, expected behavior, exploration hints, and fix hints.

In practice each problem statement costs roughly 9 LLM calls: one for scoping, one per surviving target (about 7 valid targets per instance), and one for synthesis.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CodeScout pipeline: an underspecified issue is scoped against a repository knowledge graph, each target is analyzed and scored, insights are synthesized into an enhanced problem statement, and only then is the software agent run.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.75; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    .fade2 { animation: fade 4s ease-in-out infinite; animation-delay: -3s; }
    .fade3 { animation: fade 4s ease-in-out infinite; animation-delay: -2s; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <!-- 1 issue -->
  <rect class="n" x="20" y="110" width="150" height="100" rx="10"/>
  <text class="t" x="95" y="140" text-anchor="middle" font-weight="600">Original issue</text>
  <text class="s" x="95" y="162" text-anchor="middle">short, no repro,</text>
  <text class="s" x="95" y="180" text-anchor="middle">no fix location</text>
  <path class="flow" d="M170 160 H215"/>
  <!-- 2 scoping -->
  <rect class="n acc" x="220" y="95" width="160" height="130" rx="10"/>
  <text class="t" x="300" y="122" text-anchor="middle" font-weight="600">1. Scoping</text>
  <text class="s" x="300" y="144" text-anchor="middle">LLM picks 5-10</text>
  <text class="s" x="300" y="162" text-anchor="middle">files / classes /</text>
  <text class="s" x="300" y="180" text-anchor="middle">functions from the</text>
  <text class="s" x="300" y="198" text-anchor="middle">repo graph</text>
  <!-- repo graph feeding scoping -->
  <g class="pulse">
    <circle class="n" cx="262" cy="40" r="7"/><circle class="n" cx="300" cy="22" r="7"/><circle class="n" cx="338" cy="40" r="7"/><circle class="n" cx="300" cy="58" r="7"/>
    <path class="n" d="M269 40 L293 24 M307 24 L331 40 M269 42 L293 56 M307 56 L331 42"/>
  </g>
  <text class="s" x="300" y="82" text-anchor="middle">Repository knowledge graph</text>
  <path class="flow" d="M380 160 H425" style="animation-delay:.3s"/>
  <!-- 3 analysis -->
  <rect class="n acc" x="430" y="95" width="160" height="130" rx="10"/>
  <text class="t" x="510" y="122" text-anchor="middle" font-weight="600">2. Analysis</text>
  <text class="s" x="510" y="144" text-anchor="middle">per target: role,</text>
  <text class="s" x="510" y="162" text-anchor="middle">fix hints, hypotheses,</text>
  <text class="s" x="510" y="180" text-anchor="middle">relevance score</text>
  <text class="s" x="510" y="198" text-anchor="middle">filter: score &gt; threshold</text>
  <!-- animated insight cards -->
  <g class="fade1"><rect class="n" x="445" y="245" width="130" height="20" rx="4"/><text class="s" x="510" y="259" text-anchor="middle">auth/forms.py  kept</text></g>
  <g class="fade2"><rect class="n" x="445" y="270" width="130" height="20" rx="4"/><text class="s" x="510" y="284" text-anchor="middle">target 2  kept</text></g>
  <g class="fade3"><rect class="n" x="445" y="295" width="130" height="20" rx="4"/><text class="s" x="510" y="309" text-anchor="middle">target n  dropped</text></g>
  <path class="flow" d="M590 160 H635" style="animation-delay:.6s"/>
  <!-- 4 synthesis -->
  <rect class="n acc" x="640" y="95" width="150" height="130" rx="10"/>
  <text class="t" x="715" y="122" text-anchor="middle" font-weight="600">3. Synthesis</text>
  <text class="s" x="715" y="144" text-anchor="middle">enhanced issue +</text>
  <text class="s" x="715" y="162" text-anchor="middle">repro steps +</text>
  <text class="s" x="715" y="180" text-anchor="middle">expected behavior +</text>
  <text class="s" x="715" y="198" text-anchor="middle">exploration/fix hints</text>
  <path class="flow" d="M790 160 H825" style="animation-delay:.9s"/>
  <!-- 5 agent -->
  <rect class="n" x="830" y="125" width="60" height="70" rx="10"/>
  <text class="t" x="860" y="155" text-anchor="middle" font-weight="600">Agent</text>
  <text class="s" x="860" y="176" text-anchor="middle">unchanged</text>
  <text class="s" x="860" y="230" text-anchor="middle">~9 LLM</text>
  <text class="s" x="860" y="246" text-anchor="middle">calls</text>
</svg>
<div class="anim-caption">CodeScout runs before the agent: scope the repository graph, analyze and score each target, synthesize an enhanced problem statement, then hand it to an unmodified software agent.</div>
</div>

## Example

The paper's Figure 1 walks through SWE-bench Verified instance `django__django-11790` with GPT-5-mini in mini-SWE-agent. The original issue states the symptom but gives the agent nothing to start from; the augmented version adds a reproduction test, the bug location, and a fix snippet. The text below is transcribed from the figure (trimmed with "...").

<div class="paper-example" markdown="1">
<span class="ex-label">Input: original problem statement</span>
<div class="ex-row" markdown="1">

```text
# AuthenticationForm's username field doesn't set maxlength HTML attribute.

# Description
AuthenticationForm's username field doesn't render with maxlength HTML
attribute anymore. Regression introduced in #27515 and
5ceaf14686ce626404afb6a5fbd3d8286410bf13.
https://groups.google.com/forum/?...#!topic/django-developers/qnfSqroODlA
https://forum.djangoproject.com/t/possible-authenticationform-max-length-regression-in-django-2-1/241
```

<span class="ex-bad">Agent trajectory: 21 steps of `grep`, `nl`, and repeated patch attempts. Not resolved.</span> No reproduction steps, no bug origin, unclear expectations.
</div>
<span class="ex-label">Output: CodeScout-augmented problem statement (excerpt)</span>
<div class="ex-row" markdown="1">

```text
# AuthenticationForm Username Field maxlength HTML Attribute Regression

## Issue Description
The `AuthenticationForm`'s username field no longer renders with the HTML
`maxlength` attribute. This regression was introduced in PR #27515 (commit
5ceaf14686ce626404afb6a5fbd3d8286410bf13). While the form correctly sets the
`max_length` Python property on the username field, this value is not being
propagated to the HTML `maxlength` attribute during rendering. This creates a
disconnect between server-side validation (which still enforces the maximum
length) and client-side validation/constraint (which no longer limits input
length in the browser).

## Reproduction Steps
1. Create a Django authentication form in a view:
   from django.contrib.auth.forms import AuthenticationForm

   def login_view(request):
       form = AuthenticationForm()
       return render(request, 'login.html', {'form': form})
   ...

## Expected Behavior ...
## Exploration Hints
### Files to Examine: ...
### Key Classes/Functions: ...

## Fix Hints
### High Confidence Locations:
- `AuthenticationForm.__init__()` in `django/contrib/auth/forms.py` - The most
  direct fix would be to add explicit setting of the HTML attribute where the
  Python property is already being set

### Implementation Hints:
- Add the following code in the `__init__` method of `AuthenticationForm`
  after setting `max_length`:
  self.fields['username'].widget.attrs['maxlength'] = self.username_field.max_length or 254
```

<span class="ex-good">Agent trajectory: 6 steps. The agent opens `forms.py`, applies the patch, runs the reproduction snippet, and submits. Resolved.</span>
</div>
</div>

{% include figure.html path="assets/img/papers/codescout/fig-example.png" class="img-fluid rounded" zoomable=true caption="The same instance as rendered in the paper's Figure 1. Left: the original problem statement leads to 21 steps and no resolution. Right: the CodeScout-augmented statement includes a reproduction test, the bug location, and a fix snippet, and the agent resolves the issue in 6 steps." %}

## Results

We evaluate on SWE-bench Verified with three scaffolds (SWE-agent, OpenHands, mini-SWE-agent) and three models (GPT-5-mini, DeepSeek R1, Qwen3 Coder 480B). Augmentation improves resolution rates across all scaffold and model combinations, with the largest gains when the runtime agent is weaker; overall this is a 20% improvement in resolution rate with up to 27 additional issues resolved. The ablation below uses SWE-agent as the scaffold.

| Method (SWE-agent scaffold) | DeepSeek R1 | GPT-5-mini | Qwen3 Coder |
|---|---|---|---|
| Default (no augmentation) | 114 | 194 | 183 |
| **CodeScout** | **125** | **209** | **207** |
| Agentic intra-trajectory augmentation | 109 | 177 | 158 |
| CodeScout without relevance filtering | 116 | 190 | 190 |
| CodeScout with BM25 entity selection | 119 | 195 | 198 |

<p class="table-note">Source: Table 1 of the paper. Numbers are counts of resolved issues on SWE-bench Verified with SWE-agent. Higher is better.</p>

- CodeScout adds +11 (+9.6%), +15 (+7.7%), and +24 (+13.1%) resolved issues for DeepSeek R1, GPT-5-mini, and Qwen3 Coder respectively.
- Asking the agent to augment the problem statement itself during its trajectory hurts: resolved counts drop below the default baseline by 5, 17, and 25 issues. A separate, structured pre-exploration stage is what delivers the gain.
- Relevance filtering is necessary; without it most of the benefit disappears. Replacing LLM scoping with BM25 retrieval still helps but yields smaller gains.
- File- and function-level localization also improves across models, most notably for DeepSeek R1.

**Cross-synthesis.** The model that writes the problem statement need not be the model that runs the agent.

| Runtime model | Default | Augmented by DeepSeek R1 | Augmented by Qwen3 Coder | Augmented by GPT-5-mini |
|---|---|---|---|---|
| DeepSeek R1 | 108 | 125 | **164** | 132 |
| Qwen3 Coder | 183 | 194 | **209** | 190 |
| GPT-5-mini | 194 | 196 | 207 | **209** |

<p class="table-note">Source: Table 2 of the paper. Counts of resolved issues on SWE-bench Verified; bold marks the best augmenter for each runtime model. Higher is better.</p>

- A stronger model can write problem statements for a weaker agent: DeepSeek R1 as the runtime model goes from 108 to 164 resolved issues (+56, +51.9%) when Qwen3 Coder does the augmentation.
- A stronger runtime model gains only modestly from a weaker augmenter (GPT-5-mini: 194 to 196, +1.0%), so augmentations can be pre-computed once with a capable model and reused.
- For the same token budget, augmented runs resolve more issues for Qwen3 Coder and DeepSeek R1, even after charging the augmentation overhead to the agent. GPT-5-mini's trajectories are an order of magnitude longer, so the overhead is negligible but its absolute token budget remains high.
- Trajectory analysis shows agents start with more `view` and `grep` calls and fewer `find` calls under augmentation, consistent with more targeted early exploration.

## Resources

- [arXiv: 2603.05744](https://arxiv.org/abs/2603.05744)
- [ACL Anthology (Findings of ACL 2026)](https://aclanthology.org/2026.findings-acl.2032/)
- [Amazon Science publication page](https://www.amazon.science/publications/codescout-contextual-problem-statement-enhancement-for-software-agents)
- Related on this site: [SAGE-Agent: structured uncertainty guided clarification for LLM agents](/papers/sage-clarification/), which tackles underspecified requests at the tool-calling layer
- [All publications](/publications/)
