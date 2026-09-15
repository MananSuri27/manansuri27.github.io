---
layout: paper
title: "VisDoM: Multi-Document QA with Visually Rich Elements Using Multimodal Retrieval-Augmented Generation"
short_title: "VisDoM"
description: "VisDoMBench benchmarks QA over document collections with tables, charts, and slides; VisDoMRAG fuses visual and textual RAG for a 12-20% gain. NAACL 2025."
bibkey: suri2025visdommultidocumentqavisually
authors:
  - name: Manan Suri
    url: /
    me: true
  - name: Puneet Mathur
    url: https://research.adobe.com/person/puneet-mathur/
  - name: Franck Dernoncourt
    url: https://research.adobe.com/person/franck-dernoncourt/
  - name: Kanika Goswami
  - name: Ryan A. Rossi
    url: https://ryanrossi.com/
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park; Adobe Research; Indira Gandhi Delhi Technical University for Women"
venue: "NAACL 2025 (Main Conference, Oral)"
venue_short: "NAACL 2025"
year: 2025
date: 2024-12-14
arxiv: "2412.10704"
pdf: https://arxiv.org/pdf/2412.10704
publisher_url: https://aclanthology.org/2025.naacl-long.310/
publisher_label: "ACL Anthology"
code: https://github.com/MananSuri27/VisDoM
hf_paper: https://huggingface.co/papers/2412.10704
blog: /blog/2026/visdom-explained/
figure: /assets/img/papers/visdom/hero.png
figure_alt: "VisDoMRAG pipeline: a question is answered by a visual RAG branch over retrieved pages and a textual RAG branch over retrieved chunks, each with evidence curation and chain-of-thought reasoning, and the two are combined by a modality fusion step that checks reasoning consistency."
figure_caption: "VisDoMRAG runs a visual RAG pipeline (page images retrieved by a visual retriever) and a textual RAG pipeline (OCR text chunks retrieved by a text retriever) in parallel. Each branch curates evidence and reasons step by step; a modality fusion step checks the two reasoning chains for consistency and produces the final answer."
tldr: "Real document QA runs over collections of PDFs full of tables, charts, and slides, but existing multi-document benchmarks are text-only. We introduce VisDoMBench, a 2,271-question benchmark over 1,277 visually rich documents, and VisDoMRAG, a multimodal RAG method that fuses visual and textual retrieval pipelines and improves end-to-end QA by 12-20% over unimodal and long-context baselines."
highlights:
  - value: "12-20%"
    label: "over unimodal and long-context baselines"
  - value: "2,271"
    label: "questions over 1,277 documents"
  - value: "5"
    label: "splits: tables, charts, and slides"
  - value: "50.0"
    label: "average score with GPT-4o (visual RAG 49.0, text RAG 37.3)"
og_image: https://manansuri.com/assets/img/papers/visdom/hero.png
---

## Abstract

Understanding information from a collection of multiple documents, particularly those with visually rich elements, is important for document-grounded question answering. This paper introduces VisDoMBench, the first comprehensive benchmark designed to evaluate QA systems in multi-document settings with rich multimodal content, including tables, charts, and presentation slides. We propose VisDoMRAG, a novel multimodal Retrieval Augmented Generation (RAG) approach that simultaneously utilizes visual and textual RAG, thereby combining robust visual retrieval capabilities with sophisticated linguistic reasoning. VisDoMRAG employs a multi-step reasoning process encompassing evidence curation and chain-of-thought reasoning for concurrent textual and visual RAG pipelines. A key novelty of VisDoMRAG is its consistency-constrained modality fusion mechanism, which aligns the reasoning processes across modalities at inference time to produce a coherent final answer. This leads to enhanced accuracy in scenarios where critical information is distributed across modalities and improved answer verifiability through implicit context attribution. Through extensive experiments involving open-source and proprietary large language models, we benchmark state-of-the-art document QA methods on VisDoMBench. Extensive results show that VisDoMRAG outperforms unimodal and long-context LLM baselines for end-to-end multimodal document QA by 12-20%.

## The problem

In practice, a question is rarely asked of a single PDF. Analysts, scientists, and lawyers ask questions over a folder of documents, and the system first has to find the one that answers the question, then find the page, table, or chart inside it. That is a needle-in-a-haystack problem, and the needle is often not text: a number in a table, a trend in a plot, or a bullet on a slide.

Existing multi-document QA benchmarks are almost entirely textual, and existing multimodal document QA work is single-document. There was no benchmark for the combination, and no clear answer to a simple engineering question: when documents mix text and visuals, should you retrieve page images, extracted text, or both, and how should the two be combined?

{% include figure.html path="assets/img/papers/visdom/fig-intro.png" class="img-fluid rounded" zoomable=true caption="Single-document QA assumes the grounding context is in the one document you are given. Multi-document QA has to locate the relevant document and the relevant visual element inside it, here a table row, from a collection of unstructured PDFs." %}

## Approach

**VisDoMBench** re-purposes five document QA datasets that satisfy three criteria: visually rich content, publicly available source documents, and grounded evidence. The splits are PaperTab and FetaTab (tables, via the UDA benchmark from QASPER and FeTaQA), SciGraphQA and SPIQA (charts and tables from scientific papers), and SlideVQA (multi-hop questions over slide decks). We de-duplicate across splits, filter trivial questions, and augment every question with distractor documents so that each query spans roughly 50 to 200 pages in total. Ambiguous questions are rewritten with GPT-4o and reviewed by a human annotator so that exactly one document answers each question. The result is 2,271 questions over 1,277 documents, with an average of 8.4 documents and about 129 pages per query.

**VisDoMRAG** answers a query with two parallel, evidence-driven unimodal RAG pipelines followed by a fusion step.

- **Textual RAG.** OCR the documents, chunk the text (3,000 characters with overlap), index it with a text embedding model, and retrieve the top chunks for the query.
- **Visual RAG.** Index every page as an image with a late-interaction visual retriever (ColPali or ColQwen2) and retrieve the top pages, which go to a multimodal LLM as images.
- **Three-step prompting in each branch.** Evidence Curation asks the LLM to extract and verbalize the relevant paragraphs, tables, or figure details from the retrieved context; Chain-of-Thought Reasoning links that evidence into a step-by-step argument; Answer Generation produces a response in the format the question type calls for.
- **Modality Fusion.** A final LLM call receives the curated evidence, reasoning chains, and answers from both branches and checks them for consistency, reconciling contradictions and filling reasoning gaps before producing the final answer. This is a late-fusion design, inspired by self-consistency over chains of thought.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VisDoMRAG: a query over a document collection is answered by a visual RAG branch and a textual RAG branch in parallel, and a consistency-constrained modality fusion step produces the final answer.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <!-- input -->
  <rect class="n" x="15" y="105" width="150" height="110" rx="8"/>
  <text class="t" x="90" y="128" text-anchor="middle">Query</text>
  <text class="s" x="90" y="146" text-anchor="middle">+ document collection</text>
  <rect class="n" x="60" y="160" width="34" height="42" rx="2"/>
  <rect class="n" x="70" y="166" width="34" height="42" rx="2"/>
  <rect class="n" x="80" y="172" width="34" height="42" rx="2"/>
  <text class="s" x="90" y="230" text-anchor="middle">tables, charts, slides</text>
  <!-- visual branch -->
  <rect class="n" x="230" y="15" width="330" height="110" rx="8"/>
  <text class="t" x="395" y="38" text-anchor="middle">Visual RAG</text>
  <text class="s" x="395" y="58" text-anchor="middle">ColPali / ColQwen2 retrieve top-k pages</text>
  <text class="s" x="395" y="76" text-anchor="middle">as images</text>
  <text class="s" x="395" y="100" text-anchor="middle">evidence curation &#8594; chain of thought &#8594; answer</text>
  <!-- textual branch -->
  <rect class="n" x="230" y="195" width="330" height="110" rx="8"/>
  <text class="t" x="395" y="218" text-anchor="middle">Textual RAG</text>
  <text class="s" x="395" y="238" text-anchor="middle">OCR, 3,000-char chunks, BM25 / BGE</text>
  <text class="s" x="395" y="256" text-anchor="middle">retrieve top-k chunks</text>
  <text class="s" x="395" y="280" text-anchor="middle">evidence curation &#8594; chain of thought &#8594; answer</text>
  <!-- fusion -->
  <rect class="n acc" x="625" y="100" width="160" height="120" rx="8" stroke-width="2"/>
  <text class="t" x="705" y="124" text-anchor="middle">Modality fusion</text>
  <text class="s" x="705" y="146" text-anchor="middle">compare the two</text>
  <text class="s" x="705" y="162" text-anchor="middle">reasoning chains</text>
  <text class="s" x="705" y="184" text-anchor="middle">resolve conflicts,</text>
  <text class="s" x="705" y="200" text-anchor="middle">fill reasoning gaps</text>
  <!-- answer -->
  <rect class="n" x="815" y="130" width="70" height="60" rx="8"/>
  <text class="s fade1" x="705" y="240" text-anchor="middle">fuses evidence, chains, answers</text>
  <text class="t pulse" x="850" y="165" text-anchor="middle" style="fill:#B509AC">Answer</text>
  <!-- flows -->
  <path class="flow" d="M165 140 H200 V70 H230"/>
  <path class="flow" d="M165 180 H200 V250 H230" style="animation-delay:0.2s"/>
  <path class="flow" d="M560 70 H595 V130 H625" style="animation-delay:0.6s"/>
  <path class="flow" d="M560 250 H595 V190 H625" style="animation-delay:0.8s"/>
  <path class="flow" d="M785 160 H815" style="animation-delay:1.2s"/>
</svg>
<div class="anim-caption">VisDoMRAG: visual and textual RAG run in parallel over the same query, each producing curated evidence, a reasoning chain, and an answer; modality fusion checks the two chains for consistency before answering.</div>
</div>

## Example

The paper's opening example (Figure 1, shown above under "The problem") is a question whose answer sits in one table inside one of the documents in a collection.

<div class="paper-example" markdown="1">
<span class="ex-label">Question over a document collection</span>
<div class="ex-row">Which model performs best on the Ubuntu dataset for text lengths between 60 and 90 words?</div>
<span class="ex-label">Grounding context (one table, in one of the documents)</span>
<div class="ex-row" markdown="1">

| Length | [0, 30) | [30, 60) | [60, 90) | [90, &infin;) |
|---|---|---|---|---|
| #Pair | 253578 | 207772 | 33618 | 5032 |
| LSTM | 0.707 | 0.748 | 0.732 | 0.718 |
| MV-LSTM | 0.726 | 0.752 | 0.725 | 0.694 |
| KEHNN | 0.724 | 0.774 | 0.785 | 0.791 |

</div>
<span class="ex-label">Answer</span>
<div class="ex-row"><span class="ex-good">KEHNN</span></div>
</div>

The second example is the paper's qualitative comparison on PaperTab (Figure 5). The two unimodal pipelines each latch onto a different wrong number from the same table; the fused reasoning gets the sum right.

{% include figure.html path="assets/img/papers/visdom/ex-papertab.png" class="img-fluid rounded" zoomable=true caption="Figure 5 of the paper. A PaperTab query, the ground-truth evidence table, and the answers from Visual RAG, Textual RAG, and VisDoMRAG." %}

<div class="paper-example" markdown="1">
<span class="ex-label">Query</span>
<div class="ex-row">According to 'One Size Does Not Fit All: Generating and Evaluating Variable Number of Keyphrases,' what is the approximate size of the StackEx dataset, in terms of the number of questions, used for keyphrase generation?</div>
<span class="ex-label">Ground-truth evidence and answer</span>
<div class="ex-row">The paper's dataset statistics table, StackEx row: #Train &asymp;298k, #Valid &asymp;16k, #Test &asymp;16k, Mean 2.7, Var 1.4, %Pre 57.5%. Ground-truth answer: <strong>around 330k questions</strong>.</div>
<span class="ex-label">Visual RAG</span>
<div class="ex-row"><span class="ex-bad">The approximate size of the StackEx dataset, in terms of the number of questions, used for keyphrase generation is approximately 57.5%.</span></div>
<span class="ex-label">Textual RAG</span>
<div class="ex-row"><span class="ex-bad">The approximate size of the StackEx dataset in terms of the number of questions is 298k.</span></div>
<span class="ex-label">VisDoMRAG</span>
<div class="ex-row"><span class="ex-good">The approximate size of the StackEx dataset, in terms of the number of questions, used for keyphrase generation is 330k</span></div>
</div>

## Results

<div class="table-responsive" markdown="1">

| Method | LLM | PaperTab | FetaTab | SciGraphQA | SPIQA | SlideVQA | Average |
|---|---|---|---|---|---|---|---|
| Long Context | Qwen2-VL | 8.23 | 23.10 | 16.74 | 9.93 | 2.46 | 12.09 |
| Long Context | GPT-4o | 28.37 | 60.03 | 24.12 | 36.30 | 15.06 | 32.78 |
| Text RAG | GPT-4o | 37.34 | 60.82 | 29.74 | 42.80 | 15.97 | 37.33 |
| Visual RAG | GPT-4o | 42.01 | 61.89 | 31.12 | 43.28 | 66.82 | 49.02 |
| **VisDoMRAG** | Qwen2-VL | **29.89** | **59.24** | **27.98** | **42.80** | **39.77** | **39.94** |
| **VisDoMRAG** | Gemini 1.5 Flash | **39.66** | **60.89** | **25.82** | **41.03** | **52.74** | **44.03** |
| **VisDoMRAG** | GPT-4o | **44.11** | **63.28** | **31.36** | **44.09** | **67.22** | **50.01** |

</div>
<p class="table-note">Source: Table 3 of the paper. End-to-end QA accuracy (%) on the five VisDoMBench splits, judged against the ground-truth answer. Higher is better. The full table also reports Qwen2-VL and Gemini for every baseline.</p>

- VisDoMRAG beats long-context, text-only RAG, and visual-only RAG for every LLM tested. Per-dataset gains over the baselines range from 2.1-21.6 points on PaperTab to 0.4-52.2 on SlideVQA.
- The gain is largest for the smallest open model: Qwen2-VL goes from 12.09 with long context to 39.94 with VisDoMRAG.
- Long-context models degrade as the page count per query grows (Figure 4); VisDoMRAG stays flat because retrieval bounds the context.
- Ablations with GPT-4o (Table 5): removing evidence curation, chain-of-thought, and consistency prompting drops VisDoMRAG from 50.01 to 45.98; early fusion (appending OCR text of the visually retrieved pages to the visual context) scores 43.63, below late fusion.

### Which retriever finds the right document?

| Retriever | Modality | PaperTab | SlideVQA | Average |
|---|---|---|---|---|
| BM25 | text | 65.51 | 98.55 | 81.80 |
| MiniLM | text | 65.51 | 0.73 | 61.56 |
| MPNet | text | 90.18 | 0.73 | 73.57 |
| BGE-1.5 | text | 96.81 | 81.85 | 92.40 |
| ColPali | visual | 96.93 | 97.64 | 96.15 |
| **ColQwen2** | visual | **97.61** | **97.82** | **96.94** |

<p class="table-note">Source: Table 4 of the paper. Share of queries (%) for which the ground-truth document supplies the majority of the top-5 retrieved pages or chunks. Higher is better. Dense text retrievers nearly fail on SlideVQA because slides carry sparse keyword text, while BM25 matches those keywords directly.</p>

### VisDoMBench statistics

<div class="table-responsive" markdown="1">

| Split | Domain | Content | Queries | Docs | Avg. docs / query | Avg. pages / query |
|---|---|---|---|---|---|---|
| PaperTab | Scientific papers | Tables, text | 377 | 297 | 10.82 | 113.10 |
| FetaTab | Wikipedia | Tables | 350 | 300 | 7.77 | 124.33 |
| SciGraphQA | Scientific papers | Charts | 407 | 319 | 5.91 | 129.71 |
| SPIQA | Scientific papers | Tables, charts | 586 | 117 | 9.51 | 135.58 |
| SlideVQA | Presentation decks | Slides | 551 | 244 | 6.99 | 139.71 |
| **VisDoMBench** | Combined | Tables, charts, slides, text | **2,271** | **1,277** | **8.36** | **128.69** |

</div>
<p class="table-note">Source: Table 2 of the paper (domain labels for PaperTab and FetaTab follow the source datasets, QASPER and FeTaQA). Each query is paired with distractor documents so that the collection spans roughly 50-200 pages.</p>

## Resources

- [Paper on arXiv](https://arxiv.org/abs/2412.10704) and the [ACL Anthology page](https://aclanthology.org/2025.naacl-long.310/)
- [Code and VisDoMBench](https://github.com/MananSuri27/VisDoM) on GitHub: the five data splits plus `visdomrag.py`, the VisDoMRAG implementation (ColPali/ColQwen visual retrieval; BM25, MiniLM, MPNet, BGE text retrieval; GPT-4, Gemini, Qwen backends)
- [Hugging Face Papers page](https://huggingface.co/papers/2412.10704)
- [Adobe Research publication page](https://research.adobe.com/publication/visdom-multi-document-qa-with-visually-rich-elements-using-multimodal-retrieval-augmented-generation/)
- [Explainer post](/blog/2026/visdom-explained/) on this site, and [all publications](/publications/)

### Quick start

From the repository README:

```python
from visdomrag import VisDoMRAG

config = {
    "data_dir": "./path/to/dataset",
    "output_dir": "./results",
    "llm_model": "gpt4",            # "gpt4", "gemini", "qwen"
    "vision_retriever": "colpali",  # "colpali", "colqwen"
    "text_retriever": "bm25",       # "bm25", "minilm", "mpnet", "bge"
    "api_keys": {"openai": "your-openai-key", "gemini": "your-gemini-key"},
}

pipeline = VisDoMRAG(config)
pipeline.run()                     # process all queries
# or: pipeline.process_query(query_id)
```
