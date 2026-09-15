---
layout: paper
title: "Follow the Flow: Fine-grained Flowchart Attribution with Neurosymbolic Agents"
short_title: "FlowPathAgent"
description: "FlowPathAgent traces LLM answers about flowcharts back to the exact nodes that support them, beating strong baselines by 10-14% on FlowExplainBench. EMNLP 2025."
bibkey: suri-etal-2025-follow
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
  - name: Vivek Gupta
    url: https://vgupta123.github.io/
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park; Adobe Research; Arizona State University"
venue: "EMNLP 2025 (Main Conference)"
venue_short: "EMNLP 2025"
year: 2025
date: 2025-06-02
arxiv: "2506.01344"
pdf: https://arxiv.org/pdf/2506.01344
publisher_url: https://aclanthology.org/2025.emnlp-main.1144/
publisher_label: "ACL Anthology"
code: https://github.com/MananSuri27/FollowTheFlow
checkpoints: https://huggingface.co/MananSuri27/Qwen2-7b-instruct-sft-flowchart
dataset: https://github.com/MananSuri27/FollowTheFlow/tree/main/data
hf_paper: https://huggingface.co/papers/2506.01344
figure: /assets/img/papers/follow-the-flow/hero.png
figure_alt: "Overview of FlowPathAgent: a flowchart is segmented and labeled, converted to a Mermaid graph, and then an agent calls graph tools to produce an attributed path that is mapped back onto the image."
figure_caption: "Overview of FlowPathAgent. FlowMask2Former segments and labels the flowchart nodes, Flow2Mermaid VLM converts the labeled image into a symbolic graph, and a neurosymbolic agent calls graph tools to return the attributed path, which is mapped back onto the original flowchart."
tldr: "Vision-language models routinely hallucinate connections and decision paths when they answer questions about flowcharts. We introduce fine-grained flowchart attribution, the FlowExplainBench benchmark, and FlowPathAgent, a neurosymbolic agent that grounds an answer in the exact flowchart nodes that support it and outperforms strong baselines by 10-14%."
highlights:
  - value: "77.2"
    label: "attribution F1 on FlowExplainBench (next best 70.8)"
  - value: "10-14%"
    label: "over strong baselines"
  - value: "1,238"
    label: "annotated QA pairs across 953 flowcharts"
  - value: "0.89"
    label: "Cohen's kappa between human annotators"
og_image: https://manansuri.com/assets/img/papers/follow-the-flow/hero.png
---

## Abstract

Flowcharts are a critical tool for visualizing decision-making processes. However, their non-linear structure and complex visual-textual relationships make it challenging to interpret them using LLMs, as vision-language models frequently hallucinate nonexistent connections and decision paths when analyzing these diagrams. This leads to compromised reliability for automated flowchart processing in critical domains such as logistics, health, and engineering. We introduce the task of Fine-grained Flowchart Attribution, which traces specific components grounding a flowchart referring LLM response. Flowchart Attribution ensures the verifiability of LLM predictions and improves explainability by linking generated responses to the flowchart's structure. We propose FlowPathAgent, a neurosymbolic agent that performs fine-grained post hoc attribution through graph-based reasoning. It first segments the flowchart, then converts it into a structured symbolic graph, and then employs an agentic approach to dynamically interact with the graph, to generate attribution paths. Additionally, we present FlowExplainBench, a novel benchmark for evaluating flowchart attributions across diverse styles, domains, and question types. Experimental results show that FlowPathAgent mitigates visual hallucinations in LLM answers over flowchart QA, outperforming strong baselines by 10-14% on our proposed FlowExplainBench dataset.

## The problem

Flowcharts encode a process as a graph: nodes are steps or decisions, and edges carry the conditions that move you from one to the next. When a vision-language model answers a question about a flowchart, it has to read that structure off the pixels, and it often gets it wrong in a way that is hard to catch. The answer reads fluently but follows an edge that does not exist, or skips a decision node that was actually on the path.

Attribution is the standard fix for text: point to the evidence. For flowcharts there was no equivalent. We define fine-grained flowchart attribution as mapping a flowchart-referring statement (here, a question-answer pair) to the set of regions in the image that ground it. The attributed path should be the shortest one that supports the statement, should match the flow of the process it describes, and should not need any regions outside itself to explain the statement.

{% include figure.html path="assets/img/papers/follow-the-flow/fig-intro.png" class="img-fluid rounded" zoomable=true caption="A hallucinated answer and a correct answer to the same flowchart question. The attributed path for the hallucinated answer is not logically consistent with the chart, which exposes the error; the path for the correct answer validates it and visually grounds it." %}

## Approach

FlowPathAgent is a neurosymbolic agent with three stages.

- **Chart Component Labeling.** We fine-tune Mask2Former on a synthetic, style-diversified split built from FlowVQA training data to get **FlowMask2Former**, an instance segmentation model for flowchart nodes. Each segmented node is labeled with an alphabetical identifier rendered in red on the image, so that the visual and symbolic representations share anchors.
- **Graph Construction.** **Flow2Mermaid VLM**, a Qwen2-VL (7B) model fine-tuned with SFT, transcribes the labeled flowchart into Mermaid code using the node labels as anchors. The Mermaid code is parsed into a symbolic graph that keeps boolean conditional edges and node-level statements, and we expose a suite of graph tools over it (for example `get_descendants`, `getNext`, `path_between`, `in_degree`, `BFS`).
- **Neurosymbolic Agent.** The agent plans over the labeled image once (node selection), then loops through tool selection and tool execution on the symbolic graph, analyzes the tool responses against the input statement, and emits a path of node labels. The path is mapped back onto the original flowchart through the segmentation regions.

Treating the flowchart as a graph rather than a picture means distant relationships and edge conditions are handled by exact operations instead of visual guesswork, which is where purely visual models compound errors on large charts.

**FlowExplainBench** is built from the FlowVQA test split (Code, Wiki, and Instruct domains) and covers four question types: Fact Retrieval, Applied Scenario, Flow Referential, and Topological. We render every chart in four visual styles (single color, multi color, default Mermaid, black and white). Attributions were first labeled by GPT-4 on the Mermaid source and then verified by two human annotators, with trivial count questions filtered out. The final benchmark has 1,238 QA pairs over 953 flowcharts, with an average of 21 nodes per chart and attributed paths of up to 35 nodes.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FlowPathAgent pipeline: a flowchart image is segmented and labeled, converted to a symbolic graph, reasoned over by an agent with graph tools, and the attributed path is mapped back onto the image.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; }
    .m { fill: currentColor; font-size: 12px; font-family: monospace; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <!-- 1 flowchart image -->
  <rect class="n" x="15" y="95" width="140" height="100" rx="8"/>
  <text class="t" x="85" y="118" text-anchor="middle">Flowchart image</text>
  <rect class="n" x="60" y="130" width="50" height="14" rx="3"/>
  <path class="n" d="M85 152 l14 12 l-14 12 l-14 -12 z"/>
  <path class="n" d="M85 144 v8"/>
  <!-- 2 segmentation -->
  <rect class="n" x="195" y="95" width="150" height="100" rx="8"/>
  <text class="t" x="270" y="118" text-anchor="middle">FlowMask2Former</text>
  <text class="s" x="270" y="138" text-anchor="middle">instance segmentation</text>
  <text class="s" x="270" y="156" text-anchor="middle">of every node</text>
  <text class="m pulse" x="270" y="180" text-anchor="middle" fill="#B509AC" style="fill:#B509AC">labels A, B, C ...</text>
  <!-- 3 graph -->
  <rect class="n" x="385" y="95" width="150" height="100" rx="8"/>
  <text class="t" x="460" y="118" text-anchor="middle">Flow2Mermaid VLM</text>
  <text class="s" x="460" y="138" text-anchor="middle">Qwen2-VL, fine-tuned</text>
  <text class="m" x="460" y="160" text-anchor="middle">A --&gt; B --Yes--&gt; C</text>
  <text class="s" x="460" y="180" text-anchor="middle">parsed to a graph</text>
  <!-- 4 agent -->
  <rect class="n acc" x="575" y="95" width="150" height="100" rx="8" stroke-width="2"/>
  <text class="t" x="650" y="118" text-anchor="middle">Neurosymbolic agent</text>
  <text class="s" x="650" y="138" text-anchor="middle">plan: pick nodes</text>
  <text class="s" x="650" y="156" text-anchor="middle">loop: tool call,</text>
  <text class="s" x="650" y="174" text-anchor="middle">analyze observation</text>
  <!-- 5 output -->
  <rect class="n" x="765" y="95" width="120" height="100" rx="8"/>
  <text class="t" x="825" y="118" text-anchor="middle">Attributed path</text>
  <text class="m pulse" x="825" y="146" text-anchor="middle" style="fill:#B509AC">C - F - G - J</text>
  <text class="s" x="825" y="168" text-anchor="middle">mapped back to</text>
  <text class="s" x="825" y="184" text-anchor="middle">image regions</text>
  <!-- statement input -->
  <rect class="n" x="575" y="15" width="150" height="46" rx="8"/>
  <text class="t" x="650" y="34" text-anchor="middle">Statement</text>
  <text class="s" x="650" y="52" text-anchor="middle">question + LLM answer</text>
  <!-- tools -->
  <rect class="n" x="545" y="240" width="210" height="62" rx="8"/>
  <text class="t" x="650" y="260" text-anchor="middle">Symbolic graph tools</text>
  <text class="m" x="650" y="278" text-anchor="middle">get_ancestors  path_between</text>
  <text class="m" x="650" y="294" text-anchor="middle">get_statement  bfs  in_degree</text>
  <!-- flows -->
  <path class="flow" d="M155 145 H195"/>
  <path class="flow" d="M345 145 H385" style="animation-delay:0.3s"/>
  <path class="flow" d="M535 145 H575" style="animation-delay:0.6s"/>
  <path class="flow" d="M650 61 V95" style="animation-delay:0.6s"/>
  <path class="flow" d="M630 195 V240" style="animation-delay:0.9s"/>
  <path class="flow" d="M670 240 V195" style="animation-delay:1.1s"/>
  <path class="flow" d="M725 145 H765" style="animation-delay:1.2s"/>
  <text class="s" x="606" y="222" text-anchor="end">call</text>
  <text class="s" x="694" y="222">observe</text>
</svg>
<div class="anim-caption">FlowPathAgent: FlowMask2Former labels the nodes, Flow2Mermaid VLM transcribes the labeled chart into Mermaid that is parsed into a graph, and the agent answers with graph tools before mapping the path back onto the image.</div>
</div>

## Example

The paper's opening example (Figure 1, shown above under "The problem") asks a question about a vehicle-breakdown preparedness flowchart and contrasts two LLM answers. Attribution is what separates them: the path behind the hallucinated answer runs against the chart, the path behind the correct answer follows it.

<div class="paper-example" markdown="1">
<span class="ex-label">Flowchart question</span>
<div class="ex-row">What is the immediate next step after utilizing prepared items for seeking help, and what decision led to this step?</div>
<span class="ex-label">Hallucinated response</span>
<div class="ex-row"><span class="ex-bad">The immediate next step is notifying trusted contact of travel plans, and this step was motivated by a positive response to the need to leave the vehicle.</span><br>Attributed path: <em>Notify Trusted Contact of Travel Plans</em> &rarr; <em>Need to Leave Vehicle?</em> &rarr; <em>Utilize Prepared Items for Seeking Help</em>. The path is not logically consistent with the chart, which offers the opportunity to eliminate this response.</div>
<span class="ex-label">Correct response</span>
<div class="ex-row"><span class="ex-good">The immediate next step is 'Readiness for Potential Vehicle Breakdown', which follows a 'Yes' decision at the 'Need to Leave Vehicle?' node.</span><br>Attributed path: <em>Need to Leave Vehicle?</em> &rarr; (Yes) <em>Utilize Prepared Items for Seeking Help</em> &rarr; <em>Readiness for Potential Vehicle Breakdown</em>. The path is logically consistent; the attribution validates and visually grounds the answer.</div>
</div>

The second example is the paper's qualitative comparison (Figure 5). It shows the full agent trace on an Applied Scenario question and contrasts it with the strongest baseline, GPT-4o with Set-of-Marks prompting over the same FlowMask2Former segments.

{% include figure.html path="assets/img/papers/follow-the-flow/ex-agent-trace.png" class="img-fluid rounded" zoomable=true caption="Figure 5 of the paper. Left: the flowchart with attributions from every method (black boxes are the ground truth). Middle: the statement and the GPT-4o + Set-of-Marks output. Right: FlowPathAgent's planning step, tool calls, and final attribution." %}

<div class="paper-example" markdown="1">
<span class="ex-label">Statement (question + answer)</span>
<div class="ex-row"><strong>Question:</strong> A landscape architect, Sophia, is working on a garden design that was initially measured in yards. However, the international team she's collaborating with uses the metric system. Sophia opts for an online calculator to convert the measurements but is unsure whether altitude plays a role in this scenario. Should Sophia make any adjustments before finalizing the conversion?<br><strong>Answer:</strong> Sophia should continue without altitude adjustment unless the specific context of her work requires it.</div>
<span class="ex-label">GPT-4o + FlowMask2Former Set of Marks</span>
<div class="ex-row">Lists nodes B (input of yards), C (online calculator available?), F (use the online calculator), G (altitude adjustment needed?), J (continue without altitude adjustment), M (converted value obtained), N (end).<br>Attributed path: <span class="ex-bad">B &rarr; C &rarr; F &rarr; G &rarr; J &rarr; M &rarr; N</span> (over-attributes: includes steps before and after the ones the statement depends on).</div>
<span class="ex-label">FlowPathAgent</span>
<div class="ex-row"><strong>Planning (node selection):</strong> node C, "Is an online calculator available?", is crucial as it prompts Sophia to choose an online calculator, which is directly mentioned in the question. Facts to look up: the relationship between using an online calculator and needing altitude adjustments.<br><strong>Tool calls:</strong> <code>get_ancestors("C", include_statements=True)</code> &rarr; ancestors of node C: B (Input the number of yards ('yd')), A (Start). <code>get_descendants("C", include_statements=True)</code> &rarr; descendants of node C: N (End), M (Obtain the converted value in meters ('m')), L, H, F (Use the online calculator), G (Is altitude adjustment needed?), I, J (Continue without altitude adjustment), K, D, E.<br><strong>Attribution:</strong> <span class="ex-good">C &rarr; F &rarr; G &rarr; J</span>. "The nodes C and F are relevant as they involve the use of an online calculator, which Sophia opted for. Node G is crucial because it questions the need for altitude adjustment, directly relating to the question. Node J supports the answer by advising to continue without altitude adjustment, aligning with the given response."</div>
</div>

## Results

<div class="table-responsive" markdown="1">

| Method | Overall P | Overall R | Overall F1 | Code F1 | Wiki F1 | Instruct F1 |
|---|---|---|---|---|---|---|
| Kosmos-2 | 37.14 | 1.76 | 3.36 | 11.16 | 0.60 | 3.14 |
| LISA | 18.01 | 14.34 | 15.97 | 24.87 | 12.81 | 17.24 |
| SA2VA | 66.36 | 9.88 | 17.20 | 31.10 | 13.14 | 15.56 |
| VisProg | 45.95 | 0.46 | 0.91 | 4.49 | 0.00 | 0.18 |
| GPT-4o zero-shot bounding box | 58.82 | 1.90 | 3.68 | 3.69 | 2.51 | 5.70 |
| GPT-4o + FlowMask2Former SoM | 74.10 | 67.69 | 70.75 | 68.77 | 69.47 | 74.22 |
| **FlowPathAgent** | **77.19** | **77.21** | **77.20** | **77.27** | **75.23** | **80.23** |

</div>
<p class="table-note">Source: Table 2 of the paper. Micro-averaged precision, recall, and F1 (%) over attributed nodes on FlowExplainBench, with predicted regions matched to ground-truth nodes at IoU 0.7. Higher is better.</p>

- FlowPathAgent is the best method on every split and beats the baselines by 6-65 percentage points overall; the 10-14% figure in the abstract is the gain over the strongest visual-grounding and agentic baselines.
- The visual grounding models (Kosmos-2, LISA, SA2VA) and zero-shot bounding boxes have very low recall: they can segment a node but cannot follow the chart's logic. GPT-4o with Set-of-Marks does far better because FlowMask2Former puts the right candidate nodes in front of it, but it tends to over-attribute steps further along the chart.
- Performance drops for every method as the number of nodes grows, but FlowPathAgent has the smallest drop along the long tail of node counts (Figure 3), because it treats nodes as logical entities rather than pixels.
- Error propagation across the pipeline is limited: FlowMask2Former reaches Jaccard similarity (IoU > 0.5) of 0.98 on the full benchmark, Flow2Mermaid VLM reaches word F1 of 0.89, and task F1 stays between 82.7 and 86.7 for all segmentation-quality bins above 63% IoU (Table 3).

### FlowExplainBench statistics

| | Code | Wiki | Instruct | Overall |
|---|---|---|---|---|
| Flowcharts | 189 | 470 | 294 | 953 |
| Questions | 246 | 610 | 382 | 1,238 |
| Fact Retrieval | 88 | 163 | 102 | 353 |
| Applied Scenario | 69 | 128 | 90 | 287 |
| Flow Referential | 43 | 128 | 87 | 258 |
| Topological | 46 | 191 | 103 | 340 |
| Avg. / max nodes per chart | 11.85 / 29 | 24.49 / 43 | 21.59 / 44 | 21.08 / 44 |
| Avg. / max attributed path length | 2.59 / 15 | 3.21 / 35 | 2.88 / 21 | 2.99 / 35 |

<p class="table-note">Source: Table 1 of the paper. Every chart is rendered in one of four visual styles (single color, multi color, default Mermaid, black and white); annotations were produced by GPT-4 on the Mermaid source and verified by two human annotators (Cohen's kappa 0.89 between annotators).</p>

## Resources

- [Paper on arXiv](https://arxiv.org/abs/2506.01344) and the [ACL Anthology page](https://aclanthology.org/2025.emnlp-main.1144/)
- [Code and FlowExplainBench](https://github.com/MananSuri27/FollowTheFlow) on GitHub (`data/dataset.json` holds the QA pairs and ground-truth attributions)
- Checkpoints on Hugging Face: [Flow2Mermaid VLM](https://huggingface.co/MananSuri27/Qwen2-7b-instruct-sft-flowchart) and [FlowMask2Former](https://huggingface.co/MananSuri27/finetune-instance-segmentation-flowchartseg-mask2former_20epochs_a6000); training data for [Flowchart2Mermaid](https://huggingface.co/datasets/MananSuri27/Flowchart2Mermaid) and [flowchart segmentation](https://huggingface.co/datasets/MananSuri27/flowchartseg)
- [Hugging Face Papers page](https://huggingface.co/papers/2506.01344)
- [Adobe Research publication page](https://research.adobe.com/publication/follow-the-flow-fine-grained-flowchart-attribution-with-neurosymbolic-agents/)
- Related: [ChartLens](/papers/chartlens/), our earlier work on fine-grained visual attribution in charts, and [all publications](/publications/)

### Quick start

From the repository README: the three pipeline stages run in order, then the agent is called on the benchmark.

```bash
git clone https://github.com/MananSuri27/FollowTheFlow.git
cd FollowTheFlow
pip install -r requirements.txt
python pipeline/seg_inference_scale.py   # 1. Chart Component Labeling
python pipeline/flowchart2mermaid.py     # 2. Graph Construction
```

```python
from pipeline.agents.chartpathagent import FlowPathAgent, main

input_dir = "./data/images"
input_json = "./data/dataset.json"
output_dir = "./output/chartpathagent_run"

agent = FlowPathAgent()
main(input_dir, input_json, output_dir, agent)
```
