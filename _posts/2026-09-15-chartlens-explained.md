---
layout: post
title: "Which bar is the model talking about? ChartLens explained"
description: "How ChartLens grounds a multimodal LLM's chart answers to specific bars, points, and sectors, and why that makes hallucinations easy to catch."
date: 2026-09-15 10:00:00
tags: charts multimodal attribution hallucination
categories: research
thumbnail: assets/img/papers/chartlens/hero.png
related_posts: false
toc:
  beginning: true
---

Ask a multimodal LLM "in which year did Armenia require the most import documents?" and it will answer confidently. Whether it is right is another matter. Charts encode exact numbers, and a model that misreads one bar produces text that looks fine and is wrong. In finance, policy, or science that error matters, and the reader has no cheap way to check.

Text LLMs got a partial fix years ago: attribution. Make the model cite its source and a human can verify the claim. Charts had nothing equivalent. Our ACL 2025 paper, [ChartLens: Fine-grained Visual Attribution in Charts](/papers/chartlens/), gives charts their citations: the specific bars, points, or pie sectors that support an answer.

## The idea

We call the task post-hoc fine-grained visual attribution. Given a chart and a response (a question and its answer), return the set of chart regions that justify the response. A good attribution is relevant (every region matters to the answer), complete (nothing needed is missing), and precise (nothing irrelevant is included).

Post-hoc is the important word. Attribution runs after the answer is produced, by any system, so it is a plug-in verification layer rather than a replacement chart model. If the highlighted bars do not support the answer, you have found a hallucination.

Rather than asking a model to emit pixel coordinates, which MLLMs are poor at, we first find the chart's elements ourselves, label them, and let the model reason over labels.

## How it works

{% include figure.html path="assets/img/papers/chartlens/hero.png" class="img-fluid rounded z-depth-1" zoomable=true caption="ChartLens. Stage 1 turns bars, pie sectors, and line segments into labeled marks using heuristics, SAM, and LineFormer. Stage 2 prompts a multimodal LLM with the marked chart and the response, and it returns the labels that support the answer." %}

**Stage 1: mark generation.** The goal is a set of candidate regions, one per chart element, robust to different chart styles.

- For bar charts we binarize the image with Otsu thresholding in both RGB and HSV, find contours, split them by unique pixel values so grouped bars come apart, and filter by solidity and area.
- For pie charts we find the largest contour, fit its enclosing circle, unroll the pie along the radial axis, and detect sector boundaries as edges in the unrolled strip.
- These heuristics are brittle on low-contrast images and can mistake grid lines for elements, so we sample points inside each candidate and pass them to the Segment Anything Model (SAM). SAM returns tight masks and gives weak, low-IoU masks for grid lines and labels, which filters them out.
- Lines are the hard case: thin, overlapping, intersecting. We use LineFormer, a transformer-based line extractor, then split each line into equally spaced segments so a point on a line has a mark to refer to.

**Stage 2: attribution with an MLLM.** Each element gets an alphanumeric label drawn on the image, following the set-of-marks prompting idea. The prompt explains chart attribution, gives few-shot textual examples, and asks the model to reason step by step through two questions: is the answer consistent with the chart (validation), and which labeled elements support it (attribution)? For line charts the model names pairs of marked points that bracket the relevant region.

**ChartVA-Eval.** To measure any of this we needed a benchmark, so we built one with 1,200+ samples across three subsets: ChartVA-AITQA (synthetic charts rendered from airline SEC filing tables), ChartVA-PlotQA (synthetic scientific charts from World Bank and government open data), and ChartVA-ChartQA (real charts from Statista, Pew Research, Our World in Data, and OECD). Attributions were drafted with GPT-4o from the underlying tables and then checked by annotators for relevance and completeness, with inter-annotator agreement of 0.89 and 0.84 (Cohen's kappa).

## What we found

We compared against zero-shot GPT-4o bounding-box prompting, Kosmos-2, and LISA, with GPT-4o as the MLLM inside ChartLens.

- On bar charts, ChartLens scores 69.28 F1 on ChartVA-AITQA and 64.14 on ChartVA-ChartQA; zero-shot GPT-4o gets 22.77 and 7.75, and Kosmos-2 and LISA stay under 5.
- On pie charts, ChartLens reaches 48.56 F1 versus 7.17 for GPT-4o, 11.70 for Kosmos-2, and 2.41 for LISA.
- On line charts, ChartLens covers 52% to 78% of ground-truth points while flagging only 1% to 10% of the chart area. The grounding baselines reach high detection by highlighting large regions; ChartLens uses 3 to 50 times less area.
- Overall, that is a 26-66% improvement in fine-grained attribution over the baselines.

The qualitative failures are instructive. GPT-4o tries to be specific but cannot localize through text coordinates. LISA and Kosmos-2 return generic components, such as the whole pie, no matter what the question asks.

## Try it

- Paper page: [/papers/chartlens/](/papers/chartlens/)
- arXiv: [2505.19360](https://arxiv.org/abs/2505.19360)
- Code and the ChartVA-Eval benchmark: [github.com/MananSuri27/ChartLens](https://github.com/MananSuri27/ChartLens)
- ACL Anthology: [2025.acl-long.1094](https://aclanthology.org/2025.acl-long.1094/)
