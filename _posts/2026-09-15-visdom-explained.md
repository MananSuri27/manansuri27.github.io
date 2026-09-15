---
layout: post
title: "Answering questions over a pile of PDFs: VisDoM explained"
description: "Why multi-document QA breaks when the answer is in a table or a chart, and how VisDoMRAG fuses visual and textual retrieval to fix it."
date: 2026-09-15 10:00:00
tags: rag multimodal documents benchmarks
categories: research
thumbnail: assets/img/papers/visdom/hero.png
related_posts: false
toc:
  beginning: true
---

Most document QA demos start with one PDF. You upload it, you ask a question, the model answers. Real work does not look like that. An analyst has a folder of quarterly reports, a researcher has forty papers on a topic, and the question is "which model did best on the Ubuntu dataset for texts between 60 and 90 words?" The answer is one cell in one table in one of those files. Getting there means finding the right document, the right page, and then reading a table rather than a paragraph.

Our NAACL 2025 paper, [VisDoM](/papers/visdom/), is about that setting: question answering over a collection of documents where the evidence is often visual. It contributes a benchmark, VisDoMBench, and a retrieval-augmented method, VisDoMRAG.

## The idea

Two things were missing when we started. First, multi-document QA benchmarks were text-only, and multimodal document QA benchmarks were single-document. Nobody had measured how systems behave when both problems show up at once. Second, there was a practical question with no clear answer: for documents that mix text with tables, charts, and slides, should a RAG system retrieve page images, extracted text, or both?

Our answer is both, but not by stuffing everything into one prompt. VisDoMRAG runs a visual RAG pipeline and a textual RAG pipeline independently, makes each one reason explicitly, and then has an LLM check the two reasoning chains against each other before committing to an answer. The consistency check is the part that matters: it is where a number read off a table gets reconciled with the sentence in the text that describes it.

## How it works

{% include figure.html path="assets/img/papers/visdom/hero.png" class="img-fluid rounded z-depth-1" zoomable=true caption="VisDoMRAG. A visual branch retrieves page images with a visual retriever; a textual branch retrieves OCR text chunks. Each branch curates evidence, reasons step by step, and answers. A modality fusion step compares the two reasoning chains for consistency and produces the final answer." %}

**Building the benchmark.** VisDoMBench re-purposes five existing datasets that have public source documents and grounded evidence: PaperTab and FetaTab for tables, SciGraphQA and SPIQA for charts and tables in scientific papers, and SlideVQA for multi-hop questions over slide decks. We de-duplicated questions across splits, dropped trivial ones, and then made each question multi-document by adding distractor documents until every query spans roughly 50 to 200 pages. Questions that could be answered by more than one document were rewritten with GPT-4o and checked by a human annotator. The final benchmark has 2,271 questions over 1,277 documents, about 129 pages per query on average.

**Two retrieval branches.** The textual branch OCRs the PDFs, splits the text into 3,000-character chunks, embeds them, and retrieves the top chunks for the query. The visual branch skips OCR entirely: it embeds every page as an image with a late-interaction retriever (ColPali or ColQwen2) and retrieves the top pages, which are fed to a multimodal LLM as pictures.

**Three-step prompting.** In both branches the LLM is not asked to answer directly. It first does evidence curation, pulling out the paragraphs, table rows, or figure details that matter and writing them down. Then it does chain-of-thought reasoning over that evidence. Only then does it answer, in a format matched to the question type. Curation is what keeps distractor documents from polluting the answer.

**Modality fusion.** The last step takes the curated evidence, reasoning chains, and answers from both branches and asks an LLM to evaluate whether they agree. When they conflict, it re-examines the evidence and resolves the disagreement. This is late fusion, deliberately different from early fusion, where the OCR text of the retrieved pages is appended to the image prompt.

## What we found

- VisDoMRAG beats long-context, text-only RAG, and visual-only RAG for every LLM we tried. With GPT-4o the average score across the five splits is 50.01, against 49.02 for visual RAG, 37.33 for text RAG, and 32.78 for dumping everything into a long context. Across the benchmark the gain over the baselines is 12-20%.
- The biggest win is for the small open model. Qwen2-VL-7B goes from 12.09 with long context to 39.94 with VisDoMRAG, because retrieval and structured reasoning make up for weak long-context ability.
- Visual retrieval is the stronger retriever here. ColQwen2 finds the correct source document 96.94% of the time at k=5, versus 92.40% for the best text retriever. On slides the gap is dramatic: dense text retrievers fall below 1% because slides have almost no running text, while BM25 and the visual retrievers stay above 97%.
- Late fusion beats early fusion (50.01 vs 43.63 with GPT-4o), and removing evidence curation and chain-of-thought prompting drops VisDoMRAG to 45.98.

## Try it

- Paper page on this site: [/papers/visdom/](/papers/visdom/)
- arXiv: [2412.10704](https://arxiv.org/abs/2412.10704); ACL Anthology: [2025.naacl-long.310](https://aclanthology.org/2025.naacl-long.310/)
- Code and the VisDoMBench splits: [github.com/MananSuri27/VisDoM](https://github.com/MananSuri27/VisDoM)
