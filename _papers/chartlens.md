---
layout: paper
title: "ChartLens: Fine-grained Visual Attribution in Charts"
short_title: "ChartLens"
description: "ChartLens grounds chart answers to bars, points, or sectors that support them via segmentation and set-of-marks prompting. 26-66% better attribution. ACL 2025."
bibkey: suri-etal-2025-chartlens
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
venue: "ACL 2025 (Main Conference)"
venue_short: "ACL 2025"
year: 2025
date: 2025-05-25
arxiv: "2505.19360"
pdf: https://arxiv.org/pdf/2505.19360
publisher_url: https://aclanthology.org/2025.acl-long.1094/
publisher_label: "ACL Anthology"
code: https://github.com/MananSuri27/ChartLens
dataset: https://github.com/MananSuri27/ChartLens
hf_paper: https://huggingface.co/papers/2505.19360
blog: /blog/2026/chartlens-explained/
figure: /assets/img/papers/chartlens/hero.png
figure_alt: "The ChartLens pipeline: bars and pie sectors are extracted with heuristics and refined with SAM, lines are segmented with LineFormer, the elements are rendered with labeled marks, and a multimodal LLM is prompted with the marked chart to return the marks that support a text response."
figure_caption: "ChartLens. (1) Mark generation: bars and pie sectors are found by heuristic candidate extraction and refined with SAM; lines are extracted with LineFormer and split into segments. Each element is rendered with a label. (2) Attribution: a multimodal LLM is prompted with the marked chart and the text response, and returns the marks that support it."
tldr: "Multimodal LLMs answer questions about charts but give no way to check which bars or points an answer rests on. ChartLens segments chart elements, overlays labeled marks, and prompts an MLLM to return the supporting marks; on our new ChartVA-Eval benchmark it improves fine-grained attribution by 26-66% over grounding baselines."
highlights:
  - value: "26-66%"
    label: "improvement in fine-grained attribution over baselines"
  - value: "69.3 F1"
    label: "bar-chart attribution on ChartVA-AITQA (GPT-4o zero-shot: 22.8)"
  - value: "3-50x"
    label: "less chart area flagged on line charts than grounding baselines"
  - value: "1,200+"
    label: "ChartVA-Eval samples with fine-grained attribution annotations"
og_image: https://manansuri.com/assets/img/papers/chartlens/hero.png
---

## Abstract

The growing capabilities of multimodal large language models (MLLMs) have advanced tasks like chart understanding. However, these models often suffer from hallucinations, where generated text sequences conflict with the provided visual data. To address this, we introduce Post-Hoc Visual Attribution for Charts, which identifies fine-grained chart elements that validate a given chart-associated response. We propose ChartLens, a novel chart attribution algorithm that uses segmentation-based techniques to identify chart objects and employs set-of-marks prompting with MLLMs for fine-grained visual attribution. Additionally, we present ChartVA-Eval, a benchmark with synthetic and real-world charts from diverse domains like finance, policy, and economics, featuring fine-grained attribution annotations. Our evaluations show that ChartLens improves fine-grained attributions by 26-66%.

## The problem

Charts carry exact quantities, trends, and comparisons, and MLLMs are increasingly asked to answer questions about them. When such a model hallucinates, the text looks plausible but disagrees with the image, and a reader has no quick way to tell. Text-based LLMs mitigate this with attribution: citations that let a user trace a claim to its source. Charts have had no equivalent. If an answer cannot be linked to specific bars, points, or sectors, there is no way to verify whether it is grounded in the data or in a hallucinated pattern.

We define Post-Hoc Fine-grained Visual Attribution for Charts: given a chart and a response, return the set of chart regions that support the response, with the criteria of relevance, completeness, and precision. Post-hoc attribution is a plug-and-play layer that works with any underlying chart QA system and keeps attribution separate from answer generation.

## Approach

ChartLens has two stages: generate referable marks for the chart's elements, then let an MLLM pick the marks that support the response.

- **Heuristic-guided instance segmentation for bars and pies.** Bar charts are binarized with Otsu thresholding on RGB and HSV, contours are split by unique pixel values into individual bars, and spurious contours are filtered by solidity and area. Pie charts are located by the largest contour and its enclosing circle, unrolled along the radial axis, and sector boundaries are detected as edges in the unrolled image. Points sampled from each candidate are then passed as prompts to the Segment Anything Model (SAM), which produces clean masks and naturally suppresses grid lines and labels.
- **Transformer-based line segmentation.** Lines are thin, overlapping, and often intersect, so we use LineFormer to extract them, then divide each line into equally spaced segments along its horizontal extent to serve as fine-grained marks.
- **Set-of-Marks prompting.** The segmented elements are overlaid with alphanumeric labels. The MLLM receives the marked chart with a prompt that explains chart attribution, gives few-shot textual examples, and asks for chain-of-thought reasoning in two steps: validation (is the QA pair consistent with the chart?) and attribution (which labeled elements support the answer?). For line charts, the model returns pairs of marked points between which the attribution lies.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ChartLens pipeline: a chart and a text response go through segmentation of bars, sectors and lines, the elements are overlaid with alphanumeric marks, a multimodal LLM is prompted with the marked chart, and it returns the marks that support the response.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.75; }
    .acc { stroke: #B509AC; }
    .bar { fill: currentColor; opacity: 0.35; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    .fade2 { animation: fade 4s ease-in-out infinite; animation-delay: -2.7s; }
    .fade3 { animation: fade 4s ease-in-out infinite; animation-delay: -1.4s; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <!-- 1 chart + response -->
  <rect class="n" x="20" y="80" width="150" height="150" rx="10"/>
  <text class="t" x="95" y="106" text-anchor="middle" font-weight="600">Chart + response</text>
  <rect class="bar" x="45" y="150" width="18" height="50"/><rect class="bar" x="70" y="125" width="18" height="75"/><rect class="bar" x="95" y="165" width="18" height="35"/><rect class="bar" x="120" y="140" width="18" height="60"/>
  <path class="n" d="M40 200 H150"/>
  <text class="s" x="95" y="220" text-anchor="middle">"Answer: 2006"</text>
  <path class="flow" d="M170 155 H215"/>
  <!-- 2 segmentation -->
  <rect class="n acc" x="220" y="80" width="160" height="150" rx="10"/>
  <text class="t" x="300" y="106" text-anchor="middle" font-weight="600">1. Segment</text>
  <text class="s" x="300" y="128" text-anchor="middle">bars, sectors:</text>
  <text class="s" x="300" y="146" text-anchor="middle">heuristics + SAM</text>
  <text class="s" x="300" y="164" text-anchor="middle">lines: LineFormer,</text>
  <text class="s" x="300" y="182" text-anchor="middle">split into segments</text>
  <g class="pulse"><rect class="n acc" x="250" y="195" width="18" height="25"/><rect class="n acc" x="275" y="192" width="18" height="28"/><rect class="n acc" x="300" y="200" width="18" height="20"/><rect class="n acc" x="325" y="196" width="18" height="24"/></g>
  <path class="flow" d="M380 155 H425" style="animation-delay:.3s"/>
  <!-- 3 marks -->
  <rect class="n acc" x="430" y="80" width="150" height="150" rx="10"/>
  <text class="t" x="505" y="106" text-anchor="middle" font-weight="600">2. Set-of-Marks</text>
  <text class="s" x="505" y="128" text-anchor="middle">overlay a label</text>
  <text class="s" x="505" y="146" text-anchor="middle">on every element</text>
  <rect class="n" x="455" y="170" width="18" height="50"/><rect class="n" x="480" y="160" width="18" height="60"/><rect class="n" x="505" y="185" width="18" height="35"/><rect class="n" x="530" y="175" width="18" height="45"/>
  <g class="fade1"><text class="t" x="464" y="166" text-anchor="middle" fill="#B509AC" font-size="11">A</text><text class="t" x="489" y="156" text-anchor="middle" fill="#B509AC" font-size="11">B</text><text class="t" x="514" y="181" text-anchor="middle" fill="#B509AC" font-size="11">C</text><text class="t" x="539" y="171" text-anchor="middle" fill="#B509AC" font-size="11">D</text></g>
  <path class="flow" d="M580 155 H625" style="animation-delay:.6s"/>
  <!-- 4 MLLM -->
  <rect class="n acc" x="630" y="80" width="140" height="150" rx="10"/>
  <text class="t" x="700" y="106" text-anchor="middle" font-weight="600">3. MLLM prompt</text>
  <text class="s" x="700" y="128" text-anchor="middle">marked chart +</text>
  <text class="s" x="700" y="146" text-anchor="middle">response, few-shot</text>
  <text class="s" x="700" y="164" text-anchor="middle">CoT: validate,</text>
  <text class="s" x="700" y="182" text-anchor="middle">then attribute</text>
  <g class="fade2"><rect class="n" x="645" y="195" width="110" height="24" rx="4"/><text class="s" x="700" y="211" text-anchor="middle">returns "B, D"</text></g>
  <path class="flow" d="M770 155 H815" style="animation-delay:.9s"/>
  <!-- 5 attribution -->
  <rect class="n" x="820" y="95" width="70" height="120" rx="10"/>
  <text class="t" x="855" y="120" text-anchor="middle" font-weight="600">Marks</text>
  <rect class="n" x="833" y="150" width="14" height="50"/><rect class="n" x="863" y="160" width="14" height="40"/>
  <g class="fade3"><rect class="n acc" stroke-width="3" x="833" y="150" width="14" height="50"/><rect class="n acc" stroke-width="3" x="863" y="160" width="14" height="40"/></g>
  <text class="s" x="450" y="270" text-anchor="middle">Post-hoc: works with any chart QA system; the response is not regenerated</text>
  <text class="s" x="450" y="292" text-anchor="middle">Line charts: the model returns pairs of marked points bounding the attributed span</text>
</svg>
<div class="anim-caption">ChartLens: segment the chart's elements, overlay a label on each, prompt a multimodal LLM with the marked chart and the response, and read off the marks it cites as the attribution.</div>
</div>

**ChartVA-Eval.** We build the benchmark from three sources: ChartVA-AITQA (synthetic charts rendered from airline SEC filing tables in MATSA-AITQA, with many style variations), ChartVA-PlotQA (synthetic scientific charts from World Bank Open Data, Open Government Data, and the Global Terrorism Database), and ChartVA-ChartQA (real-world charts from Statista, Pew Research, Our World in Data, and OECD, with pie charts oversampled). Questions span retrieval, reasoning, and computation. For ChartQA and PlotQA we generate initial attributions with GPT-4o from the underlying tables and templates, then have annotators verify relevance and completeness (Cohen's kappa 0.89 and 0.84).

| | ChartVA-AITQA | ChartVA-PlotQA | ChartVA-ChartQA |
|---|---|---|---|
| # of queries | 301 | 595 | 348 |
| # of charts | 301 | 581 | 266 |
| Bar / pie / line charts | 203 / 0 / 98 | 396 / 0 / 199 | 121 / 109 / 118 |
| Chart source | Synthetic | Synthetic | Real world |
| Multiple attributions | No | Yes | Yes |
| Avg. / max # of attributions | 1 / 1 | 2.4 / 12 | 1.43 / 8 |
| Avg. / max # of data series | 1.23 / 8 | 2.52 / 4 | 2.45 / 14 |

<p class="table-note">Source: Table 1 of the paper. Statistics of the three ChartVA-Eval subsets.</p>

## Example

The paper's Figure 1 shows a PlotQA-style bar chart of the number of documents required per shipment to import goods, by country and year (2005, 2006, 2007). Attribution grounds each answer to specific bars, and a reader can then check the answer against those bars.

<div class="paper-example" markdown="1">
<span class="ex-label">Input: chart + question + response</span>
<div class="ex-row">"In how many countries, is the number of documents required per shipment to import goods in 2005 greater than the average number of documents required per shipment to import goods in 2005 taken over all countries?" Ans: 3</div>
<span class="ex-label">Attribution</span>
<div class="ex-row">The 2005 bars for Algeria, Angola, and Australia. <span class="ex-good">Consistent response:</span> three highlighted bars, matching the count of 3.</div>
<span class="ex-label">Input: chart + question + response</span>
<div class="ex-row">"In which year did Armenia have the maximum number of documents required per shipment to import goods?" Ans: 2006</div>
<span class="ex-label">Attribution</span>
<div class="ex-row">The 2006 bar for Armenia. <span class="ex-bad">Inconsistent response:</span> the highlighted bar is not the tallest of Armenia's three bars, so the answer is a chart-response misalignment.</div>
</div>

{% include figure.html path="assets/img/papers/chartlens/fig-intro.png" class="img-fluid rounded" zoomable=true caption="Visual attribution for charts, as drawn in the paper's Figure 1. (1) The response is grounded to the specific bars it depends on. (2) A reader can then verify the answer: the count of 3 is consistent with the highlighted 2005 bars, while the answer 2006 for Armenia is inconsistent with the highlighted bar." %}

The paper's Figure 3 compares the attributions returned by each method on a pie, bar, and line chart.

<div class="paper-example" markdown="1">
<span class="ex-label">Pie chart</span>
<div class="ex-row">"What's the share of top 3 countries?" Answer: 41. <span class="ex-good">ChartLens</span> boxes the three largest sectors; Kosmos-2 boxes nearly the whole pie, GPT-4o's boxes only partly overlap the sectors, and LISA marks a small region below the pie.</div>
<span class="ex-label">Bar chart</span>
<div class="ex-row">"What is the difference between the highest and the second highest percentage of economically active children in services?" Answer: 2.4. <span class="ex-good">ChartLens</span> marks the two services bars; Kosmos-2 boxes the whole plot, LISA scatters small regions over many bars, and GPT-4o draws bands across entire rows.</div>
<span class="ex-label">Line chart</span>
<div class="ex-row">"What was the peak share price for ALK in 2016?" Answer: The peak share price for ALK in 2016 was $91.88. <span class="ex-good">ChartLens</span> marks the first-quarter peak of the ALK line; GPT-4o's box lands in empty space and Kosmos-2 marks the legend.</div>
</div>

{% include figure.html path="assets/img/papers/chartlens/ex-qualitative.png" class="img-fluid rounded" zoomable=true caption="Qualitative comparison from the paper's Figure 3. Color key: blue = zero-shot GPT-4o, red = LISA, pink = Kosmos-2, green = ChartLens." %}

Each ChartVA-Eval row in the released benchmark pairs a question and answer with the attributed regions (bounding boxes for bars and sectors, points for lines). A line-chart sample from the ChartVA-AITQA subset:

```text
question:   How much money did United spend for aircraft fuel in 2016?
answer:     United spent $5,813 on aircraft fuel in 2016.
chart_type: line
bboxes:     [{"x1": 684.5, "y1": 2564.9}]
```

## Results

Baselines: zero-shot GPT-4o bounding-box prompting, Kosmos-2, and LISA. ChartLens uses GPT-4o as its MLLM, `facebook/sam-vit-large` for SAM, and LineFormer. Bars and sectors are matched to ground truth by IoU and scored with precision, recall, and F1; lines are scored by detection rate (fraction of ground-truth points covered) and the percentage of chart area covered.

| Method | Bar: AITQA F1 | Bar: PlotQA F1 | Bar: ChartQA F1 | Pie: ChartQA F1 |
|---|---|---|---|---|
| Zero-shot GPT-4o | 22.77 | 3.30 | 7.75 | 7.17 |
| Kosmos-2 | 0.51 | 1.01 | 3.13 | 11.70 |
| LISA | 1.62 | 0.34 | 1.01 | 2.41 |
| **ChartLens** | **69.28** | **34.65** | **64.14** | **48.56** |

<p class="table-note">Source: Tables 2 and 4 of the paper. F1 of predicted attributions against ground truth (IoU matching) on the three ChartVA-Eval subsets. Higher is better.</p>

| Method | AITQA det. % | AITQA area % | PlotQA det. % | PlotQA area % | ChartQA det. % | ChartQA area % |
|---|---|---|---|---|---|---|
| Zero-shot GPT-4o | 18.28 | 1.94 | 6.79 | 8.63 | 3.39 | 1.15 |
| Kosmos-2 | 74.19 | 46.03 | 38.83 | 27.06 | 87.29 | 41.49 |
| LISA | 94.62 | 63.18 | 50.21 | 40.92 | 50.21 | 40.92 |
| **ChartLens** | **59.14** | **1.25** | **51.84** | **9.98** | **77.8** | **5.34** |

<p class="table-note">Source: Table 3 of the paper, line charts. Detection % is the fraction of ground-truth points covered (higher is better); area % is the share of the chart flagged (lower is better).</p>

- **Bar charts.** ChartLens reaches F1 of 69.28 on ChartVA-AITQA (precision 79.86, recall 61.17), 34.65 on ChartVA-PlotQA, and 64.14 on ChartVA-ChartQA, against 22.77, 3.30, and 7.75 for zero-shot GPT-4o; Kosmos-2 and LISA stay below 5 F1.
- **Pie charts.** F1 of 48.56 (precision 53.33, recall 44.57) against 7.17 for GPT-4o, 11.70 for Kosmos-2, and 2.41 for LISA.
- **Line charts.** LISA and Kosmos-2 achieve high detection mainly by covering large regions of the chart; ChartLens reduces the area flagged by 3 to 50 times while keeping detection rates of 59.14%, 51.84%, and 77.8%.
- Across chart types this amounts to a 26-66% improvement in fine-grained attribution over the baselines. Qualitatively, GPT-4o attempts specific selections but cannot localize reliably through text coordinates, while LISA and Kosmos-2 tend to return generic components such as the whole pie regardless of the query.

## Resources

- [arXiv: 2505.19360](https://arxiv.org/abs/2505.19360)
- [ACL Anthology (ACL 2025 Long Papers)](https://aclanthology.org/2025.acl-long.1094/)
- [Code and ChartVA-Eval benchmark on GitHub](https://github.com/MananSuri27/ChartLens)
- [Hugging Face Papers](https://huggingface.co/papers/2505.19360)
- [Adobe Research publication page](https://research.adobe.com/publication/chartlens-fine-grained-visual-attribution-in-charts/)
- [Explainer post: ChartLens](/blog/2026/chartlens-explained/)
- Related on this site: [VisDoM](/papers/visdom/), multimodal document QA over charts, tables, and slides
- [All publications](/publications/)

### Quick start

From the repository README: load a ChartVA-Eval subset and parse its attribution annotations.

```python
import pandas as pd
import json

# Load dataset
df = pd.read_csv('data/matsa_dataset.csv')   # or chartqa_dataset.csv, plotqa_dataset.csv

# Parse visual attributions
def parse_attributions(bbox_str):
    return json.loads(bbox_str) if bbox_str else []

df['attributions'] = df['bboxes'].apply(parse_attributions)

sample = df.iloc[0]
print(f"Question: {sample['question']}")
print(f"Answer: {sample['answer']}")
print(f"Attributions: {sample['attributions']}")
```

Line charts store point coordinates (`{"x1", "y1"}`); bar and pie charts store bounding boxes (`{"x1", "y1", "x2", "y2"}`). Images live under `images/MATSA`, `images/ChartQA`, and `images/PlotQA`.
