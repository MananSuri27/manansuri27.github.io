---
layout: post
title: "Turning a video into a LoRA adapter: Frames2LoRA explained"
description: "How Frames2LoRA lets a frozen vision-language model answer questions about a video with zero visual tokens in context, and where it still falls short."
date: 2026-09-14 12:00:00
tags: video vlm lora hypernetworks
categories: research
thumbnail: assets/img/papers/frames2lora/hero.png
related_posts: false
toc:
  beginning: true
---

Ask a vision-language model a question about a video and it pays twice. First it encodes every frame into hundreds of visual tokens. Then it pays that cost again on the next question, and the one after that, because the video has to sit in the context window every time. A few dozen frames is already tens of thousands of tokens before you have typed a word. Push past the model's capacity and it does not degrade gracefully: it starts emitting repetitive or unrelated text.

Most of the work on this problem tries to fit more video into the window: subsample frames, merge tokens, stretch the context, stream through a memory buffer. All of these help, and all of them leave visual tokens in context at query time. Frames2LoRA, which I worked on with Sarvesh Baskar and Dinesh Manocha at UMD, asks a different question. What if the video is not in the context at all?

## The idea

LoRA adapters are usually trained: you run gradient descent on a small low-rank update to a frozen model. Frames2LoRA predicts the adapter instead. A hypernetwork looks at a video once and emits LoRA weights in a single forward pass, with no gradient updates. Attach that adapter to the frozen VLM and it now "knows" the video. Every later question is answered from the text prompt alone, with zero visual tokens in context.

Doc-to-LoRA showed this works for text documents. Video is harder in three ways: the token volume per example is orders of magnitude larger, the compression is cross-modal (visual content has to become perturbations to a language model's weights), and video varies along a resolution axis that text does not have.

## How it works

{% include figure.html path="assets/img/papers/frames2lora/hero.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Training (left): a frozen VLM encodes the video; the Perceiver hypernetwork reads its layer-wise hidden states and generates LoRA factors, which are injected into a second frozen copy of the VLM that is trained against teacher captions. Inference (right): generate the adapter once, then answer any text query with no video tokens." %}

There are three pieces, and only one of them is trained.

A frozen SmolVLM2 acts as the video encoder. We feed it the sampled frames plus an internalization instruction and keep the text-side hidden states from every transformer layer, so the hypernetwork sees a layer-indexed stack rather than one pooled vector.

The Perceiver hypernetwork is the trainable part. For each layer, a resampler attends from learned latent queries to that layer's hidden states, and a decoder emits one latent per target module and LoRA rank direction. A shared projection head turns each latent into the A and B factors. The B-side scale starts at zero, so the untrained adapter is a no-op.

The same frozen SmolVLM2 serves as the answer model, with the generated adapter added to the MLP down-projections of its text decoder at rank 16. Training is plain teacher-forced cross-entropy: a frozen teacher that saw the frames writes captions and summaries, and the student has to reproduce them from the prompt and the adapter alone. We trained on FineVideo spans at 12 frames and 384px, with audio excluded, for the 500M and 2.2B SmolVLM2 models.

## What we found

We compared against the same model reading the video directly, with identical frames, prompts, and decoding, using token-F1 and an LLM judge that agrees with humans at Spearman 0.823, and we ran formal non-inferiority and equivalence tests rather than eyeballing means.

- On all five captioning benchmarks (ActivityNet Captions, PLM-RDCap, PLM-RCap, VDC, CaReBench), at both scales, Frames2LoRA is statistically non-inferior and equivalent to video-in-context inference. It recovers 91.9% of the base judge score at 2.2B and 84.2% at 500M.
- Video QA was never in training, yet the judge passes 7 of 8 benchmark-scale pairings, and on NExT-QA the adapter beats the base at both scales.
- Trained at 12 frames, the model stays stable through 1,024 frames and 1024px. In that regime direct inference degenerates and Frames2LoRA comes out ahead by 0.12 to 0.13 token-F1. Across the sweep, query TTFT drops 6.7x on average at 500M and 20.1x at 2.2B (maximum 79.1x), and answer-time input tokens drop by up to 1,507x.
- On VidCapBench, where each video has about 15 questions, average TTFT falls from 7.06s to 0.58s at 2.2B including the one-time internalization cost.

One result surprised us. Internalize the two halves of a video separately, concatenate the LoRA ranks, and the composed adapter keeps 93.1% (500M) and 86.2% (2.2B) of the single-adapter score, with no training for composition.

## Try it

- Paper page on this site: [/papers/frames2lora/](/papers/frames2lora/)
- arXiv: [2606.04351](https://arxiv.org/abs/2606.04351) (v1 was titled Video2LoRA)
- Code: [github.com/frames2lora/Frames2LoRA](https://github.com/frames2lora/Frames2LoRA)
- Checkpoints: [Frames2LoRA-SmolVLM-ckpts on Hugging Face](https://huggingface.co/MananSuri27/Frames2LoRA-SmolVLM-ckpts)
- Project page: [frames2lora.github.io](https://frames2lora.github.io/)
- The audio-visual follow-up: [Omni2LoRA](/papers/omni2lora/)
