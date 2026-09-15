---
layout: post
title: "Turning a video into a LoRA adapter: Frames2LoRA explained"
description: "How Frames2LoRA turns a video into a LoRA adapter so a frozen vision-language model answers questions about it with zero visual tokens in context."
date: 2026-09-14 12:00:00
tags: video vlm lora hypernetworks
categories: research
thumbnail: assets/img/papers/frames2lora/hero.png
related_posts: false
toc:
  beginning: true
---

Take one clip from CaReBench. A man in a black tank top sits by a window, brick wall behind him, wooden door to his right. He flicks a lighter, brings the flame to a pipe, and draws on it. Ask SmolVLM2 to describe the clip and it first turns each of the 12 sampled frames into hundreds of visual tokens, then reads your question, then answers. Ask a second question and it does all of that again, because the frames have to sit in the context window every time.

A few dozen frames is already tens of thousands of tokens before you have typed a word, and past the model's capacity it does not fail gently: it starts emitting repetitive text that has nothing to do with the video. Frames2LoRA, which I worked on with Sarvesh Baskar and Dinesh Manocha at UMD, takes the video out of the context entirely. It reads the frames once, writes what it saw into the model's weights as a small adapter, and from then on every question is answered from text alone.

## The idea in one picture

<div class="fig-svg">
<svg viewBox="0 0 900 370" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Left: the base model keeps hundreds of visual tokens per frame in its context window and pays that cost for every question. Right: Frames2LoRA turns the frames into a LoRA adapter once, and the frozen model answers every question with zero visual tokens in context.">
  <style>
    .n{fill:none;stroke:currentColor;stroke-width:1.5}
    .t{fill:currentColor;font-size:14px}
    .b{fill:currentColor;font-size:15px;font-weight:600}
    .s{fill:currentColor;font-size:12px;opacity:.75}
    .ar{fill:none;stroke:currentColor;stroke-width:1.5;marker-end:url(#a0)}
    .flow{fill:none;stroke:#B509AC;stroke-width:2;stroke-dasharray:6 6;animation:d0 1.2s linear infinite;marker-end:url(#a0p)}
    @keyframes d0{to{stroke-dashoffset:-24}}
  </style>
  <defs>
    <marker id="a0" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>
    <marker id="a0p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#B509AC"/></marker>
  </defs>
  <!-- left panel -->
  <text class="b" x="225" y="26" text-anchor="middle">Video in context (base model)</text>
  <rect x="30" y="52" width="110" height="70" rx="10" fill="#2698BA" fill-opacity=".15" stroke="#2698BA" stroke-width="1.5"/>
  <rect class="n" x="46" y="66" width="34" height="24" rx="3" stroke="#2698BA"/>
  <rect class="n" x="58" y="74" width="34" height="24" rx="3" stroke="#2698BA"/>
  <rect class="n" x="70" y="82" width="34" height="24" rx="3" stroke="#2698BA"/>
  <text class="s" x="85" y="116" text-anchor="middle">12 frames</text>
  <path class="ar" d="M140,87 L168,87"/>
  <rect class="n" x="170" y="46" width="250" height="82" rx="10" stroke="#9a9a9a"/>
  <text class="s" x="295" y="64" text-anchor="middle">context window</text>
  <rect x="182" y="72" width="30" height="20" rx="4" fill="#2698BA" fill-opacity=".3" stroke="#2698BA"/>
  <rect x="216" y="72" width="30" height="20" rx="4" fill="#2698BA" fill-opacity=".3" stroke="#2698BA"/>
  <rect x="250" y="72" width="30" height="20" rx="4" fill="#2698BA" fill-opacity=".3" stroke="#2698BA"/>
  <text class="t" x="296" y="87" text-anchor="middle">…</text>
  <rect x="312" y="72" width="30" height="20" rx="4" fill="#2698BA" fill-opacity=".3" stroke="#2698BA"/>
  <rect x="350" y="72" width="58" height="20" rx="4" fill="currentColor" fill-opacity=".08" stroke="currentColor"/>
  <text class="s" x="379" y="86" text-anchor="middle">query</text>
  <text class="s" x="295" y="116" text-anchor="middle">hundreds of visual tokens per frame</text>
  <path class="ar" d="M295,128 L295,158"/>
  <rect x="170" y="160" width="250" height="46" rx="10" fill="#9a9a9a" fill-opacity=".15" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="t" x="295" y="188" text-anchor="middle">Frozen SmolVLM2</text>
  <path class="ar" d="M295,206 L295,236"/>
  <rect x="170" y="238" width="250" height="44" rx="10" fill="#F29105" fill-opacity=".15" stroke="#F29105" stroke-width="1.5"/>
  <text class="t" x="295" y="265" text-anchor="middle">Answer</text>
  <text class="t" x="225" y="318" text-anchor="middle" fill="#F29105">Every question re-encodes the video</text>
  <text class="s" x="225" y="338" text-anchor="middle">tens of thousands of tokens for a few dozen frames</text>
  <!-- divider -->
  <path class="n" d="M450,20 L450,350" stroke-dasharray="2 5" opacity=".5"/>
  <!-- right panel -->
  <text class="b" x="675" y="26" text-anchor="middle">Frames2LoRA</text>
  <rect x="470" y="52" width="100" height="70" rx="10" fill="#2698BA" fill-opacity=".15" stroke="#2698BA" stroke-width="1.5"/>
  <rect class="n" x="484" y="66" width="34" height="24" rx="3" stroke="#2698BA"/>
  <rect class="n" x="496" y="74" width="34" height="24" rx="3" stroke="#2698BA"/>
  <rect class="n" x="508" y="82" width="34" height="24" rx="3" stroke="#2698BA"/>
  <text class="s" x="520" y="116" text-anchor="middle">12 frames</text>
  <path class="flow" d="M570,87 L596,87"/>
  <rect x="600" y="52" width="130" height="70" rx="10" fill="#B509AC" fill-opacity=".15" stroke="#B509AC" stroke-width="2"/>
  <text class="t" x="665" y="80" text-anchor="middle">Perceiver</text>
  <text class="t" x="665" y="98" text-anchor="middle">hypernetwork</text>
  <path class="flow" d="M730,87 L756,87"/>
  <rect x="760" y="52" width="115" height="70" rx="10" fill="#B509AC" fill-opacity=".15" stroke="#B509AC" stroke-width="2"/>
  <text class="t" x="817" y="80" text-anchor="middle">LoRA adapter</text>
  <text class="s" x="817" y="98" text-anchor="middle">A, B · rank 16</text>
  <text class="s" x="675" y="142" text-anchor="middle">one forward pass, once per video</text>
  <!-- context -->
  <rect class="n" x="600" y="154" width="275" height="52" rx="10" stroke="#9a9a9a"/>
  <text class="s" x="668" y="172" text-anchor="middle">context window</text>
  <rect x="612" y="178" width="58" height="20" rx="4" fill="currentColor" fill-opacity=".08" stroke="currentColor"/>
  <text class="s" x="641" y="192" text-anchor="middle">query</text>
  <text class="t" x="790" y="186" text-anchor="middle" fill="#00ab37">0 visual tokens</text>
  <path class="flow" d="M817,122 L817,138 L888,138 L888,261 L866,261"/>
  <path class="ar" d="M737,206 L737,236"/>
  <rect x="600" y="238" width="275" height="46" rx="10" fill="#9a9a9a" fill-opacity=".15" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="t" x="720" y="266" text-anchor="middle">Frozen SmolVLM2</text>
  <rect x="800" y="248" width="64" height="26" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/>
  <text class="s" x="832" y="266" text-anchor="middle">+ adapter</text>
  <path class="ar" d="M737,284 L737,300"/>
  <rect x="600" y="302" width="275" height="40" rx="10" fill="#00ab37" fill-opacity=".15" stroke="#00ab37" stroke-width="1.5"/>
  <text class="t" x="737" y="327" text-anchor="middle">Answer</text>
  <text class="s" x="675" y="362" text-anchor="middle" fill="#00ab37">internalize once, ask as many times as you like</text>
</svg>
<div class="fig-caption">Left: the base model keeps every frame in its context and pays for it on every question. Right: Frames2LoRA generates a LoRA adapter from the frames once; the frozen model plus adapter answers with zero visual tokens in context.</div>
</div>

<div class="callout"><span class="callout-label">Key idea</span>LoRA adapters are normally trained with gradient descent. Frames2LoRA predicts one instead: a hypernetwork (a network whose output is another network's weights) looks at the video once and emits the adapter in a single forward pass. Attach it to the frozen VLM and the model "knows" the video without a single visual token in its prompt.</div>

Doc-to-LoRA showed this works for text documents. Video is harder in three ways. The token volume per example is orders of magnitude larger, the compression is cross-modal (visual content has to become perturbations to a language model's weights), and video varies along frame count and resolution, axes that text does not have. The rest of this post follows the pipe-lighting clip through the method, one stage at a time.

## Walkthrough: one CaReBench clip, from frames to an answer with no frames

<div class="walkthrough" markdown="1">
<div class="wt-title">Walkthrough: internalizing the pipe-lighting clip and asking it a question</div>
<div class="wt-step" data-label="Sample frames" markdown="1">
<h4>1. Sample the frames and add an instruction</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Twelve frames are sampled uniformly from the clip at 384 pixels and paired with an internalization instruction. In the base model all of these frames become hundreds of visual tokens each; in Frames2LoRA none of them reach the context at query time.">
  <style>
    .n{fill:none;stroke:currentColor;stroke-width:1.5}
    .t{fill:currentColor;font-size:14px}
    .b{fill:currentColor;font-size:15px;font-weight:600}
    .s{fill:currentColor;font-size:12px;opacity:.75}
    .f{font-size:11px;fill:#2698BA}
    .ar{fill:none;stroke:currentColor;stroke-width:1.5;marker-end:url(#a1)}
  </style>
  <defs><marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
  <text class="b" x="30" y="28">CaReBench clip: a man lights a pipe by a window</text>
  <text class="s" x="30" y="48">12 frames sampled uniformly, longest edge 384 px</text>
  <g>
    <rect x="30" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="50" y="79" text-anchor="middle">f1</text>
    <rect x="74" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="94" y="79" text-anchor="middle">f2</text>
    <rect x="118" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="138" y="79" text-anchor="middle">f3</text>
    <rect x="162" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="182" y="79" text-anchor="middle">f4</text>
    <rect x="206" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="226" y="79" text-anchor="middle">f5</text>
    <rect x="250" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="270" y="79" text-anchor="middle">f6</text>
    <rect x="294" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="314" y="79" text-anchor="middle">f7</text>
    <rect x="338" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="358" y="79" text-anchor="middle">f8</text>
    <rect x="382" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="402" y="79" text-anchor="middle">f9</text>
    <rect x="426" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="446" y="79" text-anchor="middle">f10</text>
    <rect x="470" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="490" y="79" text-anchor="middle">f11</text>
    <rect x="514" y="60" width="40" height="30" rx="4" fill="#2698BA" fill-opacity=".2" stroke="#2698BA" stroke-width="1.5"/><text class="f" x="534" y="79" text-anchor="middle">f12</text>
  </g>
  <text class="s" x="30" y="112">lighter flicks on → flame meets the pipe → he sets the lighter down and smokes</text>
  <rect x="30" y="130" width="524" height="46" rx="10" fill="#2698BA" fill-opacity=".1" stroke="#2698BA" stroke-width="1.5"/>
  <text class="t" x="44" y="149">Internalization instruction  i</text>
  <text class="s" x="44" y="167">a fixed text prompt that tells the encoder to take the video in; not the user's question</text>
  <text class="s" x="30" y="206">video  v  = the 12 frames.  The user's question  p  does not enter yet.</text>
  <!-- right: token ledger -->
  <rect class="n" x="600" y="40" width="270" height="180" rx="10" stroke="#9a9a9a"/>
  <text class="b" x="735" y="66" text-anchor="middle">Visual tokens in context</text>
  <text class="s" x="735" y="84" text-anchor="middle">when the question is asked</text>
  <text class="t" x="616" y="118">Base model</text>
  <text class="t" x="854" y="118" text-anchor="end" fill="#F29105">12 × hundreds</text>
  <text class="s" x="616" y="136">every frame, every question</text>
  <text class="t" x="616" y="174">Frames2LoRA</text>
  <text class="t" x="854" y="174" text-anchor="end" fill="#00ab37">0</text>
  <text class="s" x="616" y="192">frames seen once, by the encoder</text>
  <path class="ar" d="M554,75 L598,75" stroke-dasharray="4 4" opacity=".5"/>
</svg>
</div>

We sample 12 frames uniformly from the clip, longest edge 384 px, and pair them with a fixed internalization instruction (a prompt that tells the encoder to take the video in; it is not the user's question). For the base model, these 12 frames are the expensive part: each becomes hundreds of visual tokens, and all of them ride along with every question. In Frames2LoRA they will be seen exactly once, by the encoder in the next step.

<div class="tok-row"><span class="tok tok-b">f1</span><span class="tok tok-b">f2</span><span class="tok tok-b">f3</span><span class="tok tok-b">…</span><span class="tok tok-b">f12</span><span class="tok-arrow">+</span><span class="tok tok-b">internalization instruction</span></div>

</div>
<div class="wt-step" data-label="Encode" markdown="1">
<h4>2. Run the frozen encoder and keep every layer's hidden states</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The frozen SmolVLM2 encoder reads the frames and the instruction; the text-side hidden state of every transformer layer is kept and stacked into a tensor C of shape L by S by D.">
  <style>
    .n{fill:none;stroke:currentColor;stroke-width:1.5}
    .t{fill:currentColor;font-size:14px}
    .b{fill:currentColor;font-size:15px;font-weight:600}
    .s{fill:currentColor;font-size:12px;opacity:.75}
    .ar{fill:none;stroke:currentColor;stroke-width:1.5;marker-end:url(#a2)}
    .tap{fill:none;stroke:#B509AC;stroke-width:1.5;stroke-dasharray:5 5;animation:d2 1.2s linear infinite;marker-end:url(#a2p)}
    @keyframes d2{to{stroke-dashoffset:-20}}
  </style>
  <defs>
    <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>
    <marker id="a2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#B509AC"/></marker>
  </defs>
  <!-- input -->
  <rect x="30" y="90" width="150" height="46" rx="10" fill="#2698BA" fill-opacity=".15" stroke="#2698BA" stroke-width="1.5"/>
  <text class="t" x="105" y="118" text-anchor="middle">12 frames  v</text>
  <rect x="30" y="150" width="150" height="46" rx="10" fill="#2698BA" fill-opacity=".15" stroke="#2698BA" stroke-width="1.5"/>
  <text class="t" x="105" y="178" text-anchor="middle">instruction  i</text>
  <path class="ar" d="M180,143 L226,143"/>
  <!-- frozen encoder -->
  <rect x="230" y="30" width="220" height="230" rx="10" fill="#9a9a9a" fill-opacity=".12" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="b" x="340" y="54" text-anchor="middle">Frozen SmolVLM2  E</text>
  <text class="s" x="340" y="70" text-anchor="middle">vision encoder + text decoder</text>
  <rect class="n" x="250" y="212" width="180" height="26" rx="6" stroke="#9a9a9a"/><text class="s" x="340" y="230" text-anchor="middle">layer 0</text>
  <rect class="n" x="250" y="180" width="180" height="26" rx="6" stroke="#9a9a9a"/><text class="s" x="340" y="198" text-anchor="middle">layer 1</text>
  <rect class="n" x="250" y="148" width="180" height="26" rx="6" stroke="#9a9a9a"/><text class="s" x="340" y="166" text-anchor="middle">layer 2</text>
  <text class="t" x="340" y="132" text-anchor="middle">⋮</text>
  <rect class="n" x="250" y="84" width="180" height="26" rx="6" stroke="#9a9a9a"/><text class="s" x="340" y="102" text-anchor="middle">layer L − 1</text>
  <!-- taps -->
  <path class="tap" d="M430,225 L498,225"/>
  <path class="tap" d="M430,193 L498,207"/>
  <path class="tap" d="M430,161 L498,189"/>
  <path class="tap" d="M430,97 L498,135"/>
  <!-- stack -->
  <g>
    <rect x="560" y="60" width="180" height="150" rx="6" fill="#B509AC" fill-opacity=".06" stroke="#B509AC" stroke-width="1.5"/>
    <rect x="540" y="80" width="180" height="150" rx="6" fill="#B509AC" fill-opacity=".08" stroke="#B509AC" stroke-width="1.5"/>
    <rect x="520" y="100" width="180" height="150" rx="6" fill="#B509AC" fill-opacity=".1" stroke="#B509AC" stroke-width="1.5"/>
    <rect x="500" y="120" width="180" height="150" rx="6" fill="#B509AC" fill-opacity=".14" stroke="#B509AC" stroke-width="1.5"/>
    <text class="t" x="590" y="150" text-anchor="middle">h₀</text>
    <text class="s" x="590" y="172" text-anchor="middle">S tokens × D dims</text>
    <text class="s" x="590" y="190" text-anchor="middle">text-side states</text>
    <text class="s" x="590" y="208" text-anchor="middle">after layer 0</text>
    <text class="s" x="650" y="76" text-anchor="middle">h_L−1</text>
  </g>
  <text class="b" x="780" y="120" text-anchor="start">C</text>
  <text class="s" x="780" y="140">= stack(h₀ … h_L−1)</text>
  <text class="s" x="780" y="158">shape L × S × D</text>
  <text class="s" x="780" y="186">one slice per</text>
  <text class="s" x="780" y="202">layer, not one</text>
  <text class="s" x="780" y="218">pooled vector</text>
  <text class="s" x="340" y="284" text-anchor="middle">no weights change here; hidden states are simply read out</text>
</svg>
</div>

The frames and instruction go through a frozen SmolVLM2. Instead of keeping only the final output, we keep the text-side hidden states from every transformer layer and stack them into a tensor $$\mathbf{C}$$ of shape $$L \times S \times D$$: one slice $$\mathbf{h}_\ell$$ per layer, each with $$S$$ tokens of $$D$$ dimensions. Keeping the layer axis is deliberate. It lets the next stage write a different adapter for each layer instead of squeezing the whole video into one pooled vector and reusing it everywhere.

</div>
<div class="wt-step" data-label="Perceiver" markdown="1">
<h4>3. The Perceiver hypernetwork reads each layer slice</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="For one layer slice, learned latent queries attend to the hidden states in an encoder resampler; a decoder resampler then emits one latent per LoRA rank direction, sixteen for the down-projection module of that layer. This repeats for every layer.">
  <style>
    .n{fill:none;stroke:currentColor;stroke-width:1.5}
    .t{fill:currentColor;font-size:14px}
    .b{fill:currentColor;font-size:15px;font-weight:600}
    .s{fill:currentColor;font-size:12px;opacity:.75}
    .ar{fill:none;stroke:currentColor;stroke-width:1.5;marker-end:url(#a3)}
    .att{fill:none;stroke:#B509AC;stroke-width:1;opacity:.6;stroke-dasharray:3 4;animation:d3 1.5s linear infinite}
    @keyframes d3{to{stroke-dashoffset:-14}}
  </style>
  <defs><marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
  <!-- layer slice -->
  <text class="b" x="100" y="30" text-anchor="middle">Layer slice  h_ℓ</text>
  <text class="s" x="100" y="48" text-anchor="middle">S tokens × D dims</text>
  <rect x="40" y="60" width="120" height="200" rx="8" fill="#B509AC" fill-opacity=".1" stroke="#B509AC" stroke-width="1.5"/>
  <g stroke="#B509AC" opacity=".5">
    <line x1="52" y1="80" x2="148" y2="80"/><line x1="52" y1="100" x2="148" y2="100"/><line x1="52" y1="120" x2="148" y2="120"/>
    <line x1="52" y1="140" x2="148" y2="140"/><line x1="52" y1="160" x2="148" y2="160"/><line x1="52" y1="180" x2="148" y2="180"/>
    <line x1="52" y1="200" x2="148" y2="200"/><line x1="52" y1="220" x2="148" y2="220"/><line x1="52" y1="240" x2="148" y2="240"/>
  </g>
  <text class="s" x="100" y="284" text-anchor="middle">one token per row</text>
  <!-- encoder resampler -->
  <rect x="230" y="60" width="200" height="110" rx="10" fill="#B509AC" fill-opacity=".15" stroke="#B509AC" stroke-width="2"/>
  <text class="t" x="330" y="84" text-anchor="middle">Encoder resampler</text>
  <text class="s" x="330" y="104" text-anchor="middle">learned latent queries</text>
  <text class="s" x="330" y="120" text-anchor="middle">cross-attend to h_ℓ</text>
  <text class="s" x="330" y="136" text-anchor="middle">→ fixed-size summary</text>
  <text class="s" x="330" y="156" text-anchor="middle">latent size Z = 512</text>
  <path class="att" d="M160,80 L230,115"/><path class="att" d="M160,140 L230,115"/><path class="att" d="M160,200 L230,115"/><path class="att" d="M160,240 L230,115"/>
  <!-- decoder resampler -->
  <path class="ar" d="M330,170 L330,196"/>
  <rect x="230" y="200" width="200" height="90" rx="10" fill="#B509AC" fill-opacity=".15" stroke="#B509AC" stroke-width="2"/>
  <text class="t" x="330" y="226" text-anchor="middle">Decoder resampler</text>
  <text class="s" x="330" y="246" text-anchor="middle">one output query per</text>
  <text class="s" x="330" y="262" text-anchor="middle">(target module m, rank r)</text>
  <text class="s" x="330" y="280" text-anchor="middle">M = 1 module, R = 16 ranks</text>
  <path class="ar" d="M430,245 L476,245"/>
  <!-- rank latents grid -->
  <text class="b" x="640" y="30" text-anchor="middle">16 rank latents for layer ℓ</text>
  <text class="s" x="640" y="48" text-anchor="middle">module m = MLP down_proj</text>
  <g font-size="11" fill="#B509AC">
    <rect x="490" y="70" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="520" y="91" text-anchor="middle">r = 1</text>
    <rect x="558" y="70" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="588" y="91" text-anchor="middle">r = 2</text>
    <rect x="626" y="70" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="656" y="91" text-anchor="middle">r = 3</text>
    <rect x="694" y="70" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="724" y="91" text-anchor="middle">r = 4</text>
    <rect x="490" y="112" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="520" y="133" text-anchor="middle">r = 5</text>
    <rect x="558" y="112" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="588" y="133" text-anchor="middle">r = 6</text>
    <rect x="626" y="112" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="656" y="133" text-anchor="middle">r = 7</text>
    <rect x="694" y="112" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="724" y="133" text-anchor="middle">r = 8</text>
    <rect x="490" y="154" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="520" y="175" text-anchor="middle">r = 9</text>
    <rect x="558" y="154" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="588" y="175" text-anchor="middle">r = 10</text>
    <rect x="626" y="154" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="656" y="175" text-anchor="middle">r = 11</text>
    <rect x="694" y="154" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="724" y="175" text-anchor="middle">r = 12</text>
    <rect x="490" y="196" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="520" y="217" text-anchor="middle">r = 13</text>
    <rect x="558" y="196" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="588" y="217" text-anchor="middle">r = 14</text>
    <rect x="626" y="196" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="656" y="217" text-anchor="middle">r = 15</text>
    <rect x="694" y="196" width="60" height="34" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/><text x="724" y="217" text-anchor="middle">r = 16</text>
  </g>
  <text class="s" x="622" y="258" text-anchor="middle">each latent is a vector of size Z = 512</text>
  <text class="s" x="622" y="276" text-anchor="middle">full output  O ∈ R^(L × M × R × Z)</text>
  <text class="t" x="622" y="304" text-anchor="middle" fill="#B509AC">repeated for every layer ℓ = 0 … L − 1</text>
  <text class="s" x="800" y="140" text-anchor="middle">still no</text>
  <text class="s" x="800" y="156" text-anchor="middle">weights,</text>
  <text class="s" x="800" y="172" text-anchor="middle">just latents</text>
</svg>
</div>

This is the only trained component. For each layer slice, an encoder resampler lets a set of learned latent queries (latent size 512) cross-attend to the $$S$$ hidden states, producing a fixed-size summary no matter how many frames went in. A decoder resampler then asks that summary one question per target module and per LoRA rank direction. With one target module (the MLP down-projection) and rank 16, that is 16 rank latents for this layer. The same thing happens for every layer, so the output is a tensor of shape $$L \times M \times R \times Z$$: still latents, not weights.

</div>
<div class="wt-step" data-label="A and B" markdown="1">
<h4>4. Latents become LoRA factors and attach to the frozen model</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A shared projection head maps each rank latent to one row of A and one row of B, giving rank-16 factors for the layer. They are added to the frozen MLP down-projection as a low-rank update; the B scale starts at zero so an untrained adapter changes nothing.">
  <style>
    .n{fill:none;stroke:currentColor;stroke-width:1.5}
    .t{fill:currentColor;font-size:14px}
    .b{fill:currentColor;font-size:15px;font-weight:600}
    .s{fill:currentColor;font-size:12px;opacity:.75}
    .ar{fill:none;stroke:currentColor;stroke-width:1.5;marker-end:url(#a4)}
    .flow{fill:none;stroke:#B509AC;stroke-width:2;stroke-dasharray:6 6;animation:d4 1.2s linear infinite;marker-end:url(#a4p)}
    @keyframes d4{to{stroke-dashoffset:-24}}
  </style>
  <defs>
    <marker id="a4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>
    <marker id="a4p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#B509AC"/></marker>
  </defs>
  <!-- latents -->
  <text class="b" x="90" y="30" text-anchor="middle">16 rank latents</text>
  <text class="s" x="90" y="48" text-anchor="middle">layer ℓ, from step 3</text>
  <g fill="#B509AC" fill-opacity=".2" stroke="#B509AC">
    <rect x="40" y="62" width="100" height="16" rx="4"/><rect x="40" y="84" width="100" height="16" rx="4"/><rect x="40" y="106" width="100" height="16" rx="4"/>
    <rect x="40" y="128" width="100" height="16" rx="4"/><rect x="40" y="172" width="100" height="16" rx="4"/><rect x="40" y="194" width="100" height="16" rx="4"/>
  </g>
  <text class="t" x="90" y="164" text-anchor="middle">⋮</text>
  <text class="s" x="90" y="230" text-anchor="middle">r = 1 … 16</text>
  <path class="ar" d="M140,136 L196,136"/>
  <!-- projection head -->
  <rect x="200" y="96" width="150" height="80" rx="10" fill="#B509AC" fill-opacity=".15" stroke="#B509AC" stroke-width="2"/>
  <text class="t" x="275" y="124" text-anchor="middle">Shared</text>
  <text class="t" x="275" y="142" text-anchor="middle">projection head</text>
  <text class="s" x="275" y="162" text-anchor="middle">same head for all layers</text>
  <path class="flow" d="M350,120 L396,80"/>
  <path class="flow" d="M350,152 L396,192"/>
  <!-- A and B -->
  <rect x="400" y="50" width="200" height="56" rx="8" fill="#B509AC" fill-opacity=".2" stroke="#B509AC" stroke-width="1.5"/>
  <text class="t" x="500" y="74" text-anchor="middle">A_ℓ   (16 × d_in)</text>
  <text class="s" x="500" y="94" text-anchor="middle">learned scale, starts at 1</text>
  <rect x="400" y="166" width="200" height="56" rx="8" fill="#B509AC" fill-opacity=".2" stroke="#B509AC" stroke-width="1.5"/>
  <text class="t" x="500" y="190" text-anchor="middle">B_ℓ   (16 × d_out)</text>
  <text class="s" x="500" y="210" text-anchor="middle">learned scale, starts at 0</text>
  <text class="s" x="500" y="140" text-anchor="middle">one row of each per rank latent</text>
  <text class="s" x="500" y="248" text-anchor="middle">B at zero ⇒ untrained adapter is a no-op</text>
  <!-- injection -->
  <path class="flow" d="M600,78 L646,120"/>
  <path class="flow" d="M600,194 L646,152"/>
  <rect x="650" y="60" width="220" height="150" rx="10" fill="#9a9a9a" fill-opacity=".12" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="b" x="760" y="86" text-anchor="middle">Layer ℓ, MLP down_proj</text>
  <text class="s" x="760" y="104" text-anchor="middle">frozen weight  W_ℓ  (d_out × d_in)</text>
  <text class="t" x="760" y="140" text-anchor="middle">y = x W_ℓᵀ + s · (x A_ℓᵀ) B_ℓ</text>
  <text class="s" x="760" y="164" text-anchor="middle">a rank-16 update ΔW_ℓ = s · B_ℓᵀ A_ℓ</text>
  <text class="s" x="760" y="180" text-anchor="middle">on top of weights that never change</text>
  <text class="s" x="760" y="198" text-anchor="middle" fill="#B509AC">specific to this video</text>
  <text class="s" x="760" y="248" text-anchor="middle">this is the adapter  θ(v): {A_ℓ, B_ℓ} for every layer</text>
</svg>
</div>

A shared projection head turns each rank latent into one row of $$\mathbf{A}_\ell$$ and one row of $$\mathbf{B}_\ell$$, giving rank-16 factors for the layer. Learned multipliers scale them; the $$\mathbf{B}$$ scale is initialized to zero, so before training the adapter is a null perturbation and the model behaves exactly like the base. The factors are added to the frozen down-projection of that layer as a standard LoRA update. The full set, $$\theta(v) = \{\mathbf{A}_\ell, \mathbf{B}_\ell\}_{\ell}$$, is the adapter for this one video. Notice what happened to the token budget along the way:

<div class="tok-row"><span class="tok tok-b tok-x">f1</span><span class="tok tok-b tok-x">f2</span><span class="tok tok-b tok-x">…</span><span class="tok tok-b tok-x">f12</span><span class="tok-arrow">→</span><span class="tok tok-a">A_0, B_0</span><span class="tok tok-a">A_1, B_1</span><span class="tok tok-a">…</span><span class="tok tok-a">A_L−1, B_L−1</span><span class="tok-arrow">→</span><span class="tok tok-c tok-hl">0 visual tokens in context</span></div>

</div>
<div class="wt-step" data-label="Ask" markdown="1">
<h4>5. Ask the question with zero visual tokens</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Top: the base model answers the CaReBench caption prompt with all twelve frames in context and misreads the pipe as a piece of paper, token-F1 0.32. Bottom: the same frozen model with the generated adapter answers from the text prompt alone, zero visual tokens, and describes the lighter and the lighting correctly, token-F1 0.56.">
  <style>
    .n{fill:none;stroke:currentColor;stroke-width:1.5}
    .t{fill:currentColor;font-size:14px}
    .b{fill:currentColor;font-size:15px;font-weight:600}
    .s{fill:currentColor;font-size:12px;opacity:.75}
    .ar{fill:none;stroke:currentColor;stroke-width:1.5;marker-end:url(#a5)}
  </style>
  <defs><marker id="a5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
  <!-- base row -->
  <text class="b" x="30" y="28">Base model, video in context</text>
  <rect class="n" x="30" y="40" width="380" height="92" rx="10" stroke="#9a9a9a"/>
  <text class="s" x="44" y="58">context window</text>
  <g fill="#2698BA" fill-opacity=".3" stroke="#2698BA">
    <rect x="44" y="66" width="26" height="18" rx="3"/><rect x="74" y="66" width="26" height="18" rx="3"/><rect x="104" y="66" width="26" height="18" rx="3"/>
    <rect x="134" y="66" width="26" height="18" rx="3"/><rect x="164" y="66" width="26" height="18" rx="3"/><rect x="194" y="66" width="26" height="18" rx="3"/>
    <rect x="224" y="66" width="26" height="18" rx="3"/><rect x="254" y="66" width="26" height="18" rx="3"/><rect x="284" y="66" width="26" height="18" rx="3"/>
    <rect x="314" y="66" width="26" height="18" rx="3"/><rect x="344" y="66" width="26" height="18" rx="3"/><rect x="374" y="66" width="26" height="18" rx="3"/>
  </g>
  <text class="s" x="44" y="100">12 frames × hundreds of visual tokens each</text>
  <rect x="44" y="106" width="352" height="20" rx="4" fill="currentColor" fill-opacity=".08" stroke="currentColor"/>
  <text class="s" x="220" y="120" text-anchor="middle">"Describe the video in as much useful visual detail…"</text>
  <path class="ar" d="M410,86 L446,86"/>
  <rect x="450" y="62" width="130" height="48" rx="10" fill="#9a9a9a" fill-opacity=".15" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="t" x="515" y="90" text-anchor="middle">Frozen SmolVLM2</text>
  <path class="ar" d="M580,86 L616,86"/>
  <rect x="620" y="40" width="250" height="92" rx="10" fill="#F29105" fill-opacity=".12" stroke="#F29105" stroke-width="1.5"/>
  <text class="s" x="632" y="58">"…holding a lighter and</text>
  <text class="s" x="632" y="74" fill="#F29105" opacity="1">a piece of paper. He is blowing</text>
  <text class="s" x="632" y="90" fill="#F29105" opacity="1">on the paper…"</text>
  <text class="t" x="632" y="120" fill="#F29105">token-F1 0.32</text>
  <!-- divider -->
  <path class="n" d="M30,158 L870,158" stroke-dasharray="2 5" opacity=".5"/>
  <!-- f2l row -->
  <text class="b" x="30" y="186">Frames2LoRA, adapter attached</text>
  <rect class="n" x="30" y="198" width="380" height="92" rx="10" stroke="#9a9a9a"/>
  <text class="s" x="44" y="216">context window</text>
  <text class="t" x="44" y="244" fill="#00ab37">0 visual tokens</text>
  <text class="s" x="170" y="244">(the frames were internalized in steps 1–4)</text>
  <rect x="44" y="264" width="352" height="20" rx="4" fill="currentColor" fill-opacity=".08" stroke="currentColor"/>
  <text class="s" x="220" y="278" text-anchor="middle">"Describe the video in as much useful visual detail…"</text>
  <path class="ar" d="M410,244 L446,244"/>
  <rect x="450" y="212" width="130" height="64" rx="10" fill="#9a9a9a" fill-opacity=".15" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="t" x="515" y="236" text-anchor="middle">Frozen SmolVLM2</text>
  <rect x="470" y="246" width="90" height="22" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/>
  <text class="s" x="515" y="261" text-anchor="middle">+ θ(v)</text>
  <path class="ar" d="M580,244 L616,244"/>
  <rect x="620" y="198" width="250" height="92" rx="10" fill="#00ab37" fill-opacity=".12" stroke="#00ab37" stroke-width="1.5"/>
  <text class="s" x="632" y="216">"…black tank top… tattoos…</text>
  <text class="s" x="632" y="232" fill="#00ab37" opacity="1">using their left hand to light</text>
  <text class="s" x="632" y="248" fill="#00ab37" opacity="1">it with a lighter."</text>
  <text class="t" x="632" y="278" fill="#00ab37">token-F1 0.56</text>
  <text class="s" x="450" y="318" text-anchor="middle">same model weights, same prompt, same decoding; only the video's route into the model differs</text>
</svg>
</div>

Now the CaReBench caption prompt goes in: "Describe the video in as much useful visual detail as possible. Include the main activity, visible people or objects, scene context, appearance, and any important visual details that help explain what is happening." Same frozen SmolVLM2, same prompt, same decoding in both rows. The base model, with all 12 frames in context, gets the room right but misreads the action: "He is holding a lighter and <span class="tok tok-d">a piece of paper. He is blowing on the paper and then putting it in his mouth.</span>" (token-F1 0.32 against the reference). Frames2LoRA, with nothing but the prompt in context, answers: "A person is smoking a cigarette in a room with a brick wall and a wooden door. The person is wearing a black tank top and has tattoos on their arms. <span class="tok tok-c">They are holding the cigarette in their right hand and using their left hand to light it with a lighter.</span>" (token-F1 0.56). It calls the pipe a cigarette, but it has the tank top, the tattoos, the lighter and the act of lighting.

</div>
<div class="wt-step" data-label="Reuse" markdown="1">
<h4>6. Keep the adapter and ask again</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="One generated adapter serves every question about the video. On VidCapBench, with about fifteen questions per video, average time to first token per question falls from 7.06 seconds to 0.58 seconds for the 2.2B model, including the one-time internalization.">
  <style>
    .n{fill:none;stroke:currentColor;stroke-width:1.5}
    .t{fill:currentColor;font-size:14px}
    .b{fill:currentColor;font-size:15px;font-weight:600}
    .s{fill:currentColor;font-size:12px;opacity:.75}
    .q{fill:none;stroke:#2698BA;stroke-width:1.5;marker-end:url(#a6b)}
    .o{fill:none;stroke:#00ab37;stroke-width:1.5;marker-end:url(#a6g)}
    .flow{fill:none;stroke:#B509AC;stroke-width:2;stroke-dasharray:6 6;animation:d6 1.2s linear infinite;marker-end:url(#a6p)}
    @keyframes d6{to{stroke-dashoffset:-24}}
  </style>
  <defs>
    <marker id="a6b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2698BA"/></marker>
    <marker id="a6g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#00ab37"/></marker>
    <marker id="a6p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#B509AC"/></marker>
  </defs>
  <!-- adapter -->
  <rect x="30" y="70" width="140" height="70" rx="10" fill="#B509AC" fill-opacity=".15" stroke="#B509AC" stroke-width="2"/>
  <text class="t" x="100" y="98" text-anchor="middle">θ(v)</text>
  <text class="s" x="100" y="118" text-anchor="middle">generated once</text>
  <path class="flow" d="M170,105 L226,105"/>
  <!-- model -->
  <rect x="230" y="40" width="170" height="130" rx="10" fill="#9a9a9a" fill-opacity=".15" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="t" x="315" y="96" text-anchor="middle">Frozen SmolVLM2</text>
  <rect x="270" y="110" width="90" height="24" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/>
  <text class="s" x="315" y="126" text-anchor="middle">+ θ(v)</text>
  <!-- questions fan in from the right-top, answers out right-bottom -->
  <g fill="#2698BA" fill-opacity=".15" stroke="#2698BA" font-size="12">
    <rect x="470" y="32" width="150" height="22" rx="5"/><rect x="470" y="60" width="150" height="22" rx="5"/><rect x="470" y="88" width="150" height="22" rx="5"/><rect x="470" y="144" width="150" height="22" rx="5"/>
  </g>
  <text class="s" x="545" y="47" text-anchor="middle">Q1: What is the weather like?</text>
  <text class="s" x="545" y="75" text-anchor="middle">Q2: second question</text>
  <text class="s" x="545" y="103" text-anchor="middle">Q3: third question</text>
  <text class="t" x="545" y="134" text-anchor="middle">⋮</text>
  <text class="s" x="545" y="159" text-anchor="middle">Q15: fifteenth question</text>
  <path class="q" d="M470,43 L402,80"/><path class="q" d="M470,71 L402,92"/><path class="q" d="M470,99 L402,104"/><path class="q" d="M470,155 L402,128"/>
  <text class="s" x="545" y="186" text-anchor="middle">VidCapBench: 15.23 questions per video</text>
  <text class="s" x="545" y="202" text-anchor="middle">each one: text prompt only, 0 visual tokens</text>
  <!-- TTFT bars -->
  <text class="b" x="30" y="222">Average TTFT per question, 2.2B, internalization time included</text>
  <rect x="30" y="234" width="450" height="18" rx="4" fill="#F29105" fill-opacity=".25" stroke="#F29105"/>
  <text class="t" x="490" y="248" fill="#F29105">7.06 s   base, video in context</text>
  <rect x="30" y="262" width="37" height="18" rx="4" fill="#00ab37" fill-opacity=".3" stroke="#00ab37"/>
  <text class="t" x="77" y="276" fill="#00ab37">0.58 s   Frames2LoRA, adapter reused</text>
  <text class="s" x="870" y="296" text-anchor="end">500M: 6.45 s → 0.55 s</text>
</svg>
</div>

The adapter does not expire after one answer. Every later question about the same video is a text-only prompt through the same adapted model, and the frames are never re-encoded. VidCapBench is the natural place to measure this, because each video comes with 15.23 questions on average. Averaged over all 1,523 queries, and charging Frames2LoRA for the one-time internalization, time to first token per question drops from 7.06 s to 0.58 s at 2.2B and from 6.45 s to 0.55 s at 500M. Amortized over the first 5 questions it is already 1.44 s per question at 2.2B; after 10 it is 0.80 s.

</div>
</div>

## Under the hood

| Symbol | Meaning |
|---|---|
| $$v$$, $$i$$, $$p$$, $$y$$ | video, internalization instruction, downstream text prompt, response |
| $$E$$, $$F$$ | frozen SmolVLM2 used as video encoder and as answer model (same weights) |
| $$H_\phi$$ | the Perceiver hypernetwork; $$\phi$$ are the only trained parameters |
| $$\mathbf{h}_\ell$$, $$\mathbf{C}$$ | text-side hidden states after layer $$\ell$$; their stack, $$L \times S \times D$$ |
| $$L$$, $$S$$, $$D$$ | number of layers, fused sequence length, hidden dimension |
| $$M$$, $$R$$, $$Z$$ | target modules per layer (1: MLP down_proj), LoRA rank (16), latent size (512) |
| $$\mathbf{A}_{\ell,m} \in \mathbb{R}^{R \times d_{\mathrm{in}}}$$, $$\mathbf{B}_{\ell,m} \in \mathbb{R}^{R \times d_{\mathrm{out}}}$$ | generated LoRA factors for layer $$\ell$$, module $$m$$ |
| $$\theta(v)$$ | the generated adapter: all $$\mathbf{A}$$, $$\mathbf{B}$$ factors for video $$v$$ |
| $$s$$ | fixed LoRA scaling factor |
{: .notation}

The whole method is three lines. The encoder produces video-conditioned states, the hypernetwork maps them to an adapter, and the answer model conditions on the prompt and the adapter but never on the video tokens:

$$
\mathbf{C} = E(v, i), \qquad \theta(v) = H_\phi(\mathbf{C}), \qquad p_\phi(y \mid p, v) = F\big(y \mid p;\, \theta(v)\big).
$$

Inside a frozen linear layer with weight $$\mathbf{W} \in \mathbb{R}^{d_{\mathrm{out}} \times d_{\mathrm{in}}}$$, the generated factors act as an ordinary LoRA update. In the row-vector convention the layer computes $$\mathbf{x}\mathbf{W}^\top$$ and the adapter adds a rank-$$R$$ term, which is the same as perturbing the weight by $$\Delta\mathbf{W} = s\,\mathbf{B}^\top\mathbf{A}$$:

$$
\mathbf{y} = \mathbf{x}\mathbf{W}^\top + s\,(\mathbf{x}\mathbf{A}_{\ell,m}^\top)\,\mathbf{B}_{\ell,m}.
$$

Training is teacher-forced cross-entropy over response tokens. A frozen SmolVLM2 teacher that does see the frames writes captions and summaries offline; the student answer model has to reproduce them from the prompt and the adapter alone, and the gradient flows only into $$\phi$$:

$$
\mathcal{L}(\phi) = -\sum_t \log p_\phi\big(y_t \mid y_{<t},\, p;\, \theta(v)\big).
$$

<div class="fig-svg">
<svg viewBox="0 0 900 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Architecture: video and instruction enter the frozen encoder E, which yields layer-wise states C; the Perceiver hypernetwork H with parameters phi maps C to the adapter theta of v; the frozen answer model F plus the adapter answers the text prompt p. Training compares the output with a caption written by a frozen teacher that saw the frames, and gradients flow only into phi.">
  <style>
    .n{fill:none;stroke:currentColor;stroke-width:1.5}
    .t{fill:currentColor;font-size:14px}
    .b{fill:currentColor;font-size:15px;font-weight:600}
    .s{fill:currentColor;font-size:12px;opacity:.75}
    .ar{fill:none;stroke:currentColor;stroke-width:1.5;marker-end:url(#a7)}
    .flow{fill:none;stroke:#B509AC;stroke-width:2;stroke-dasharray:6 6;animation:d7 1.2s linear infinite;marker-end:url(#a7p)}
    .grad{fill:none;stroke:#F29105;stroke-width:1.5;stroke-dasharray:3 4;marker-end:url(#a7o)}
    @keyframes d7{to{stroke-dashoffset:-24}}
  </style>
  <defs>
    <marker id="a7" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>
    <marker id="a7p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#B509AC"/></marker>
    <marker id="a7o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#F29105"/></marker>
  </defs>
  <!-- inputs -->
  <rect x="20" y="70" width="110" height="60" rx="10" fill="#2698BA" fill-opacity=".15" stroke="#2698BA" stroke-width="1.5"/>
  <text class="t" x="75" y="96" text-anchor="middle">video  v</text>
  <text class="s" x="75" y="116" text-anchor="middle">+ instruction  i</text>
  <path class="ar" d="M130,100 L166,100"/>
  <!-- E -->
  <rect x="170" y="60" width="130" height="80" rx="10" fill="#9a9a9a" fill-opacity=".15" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="t" x="235" y="92" text-anchor="middle">Encoder  E</text>
  <text class="s" x="235" y="112" text-anchor="middle">frozen SmolVLM2</text>
  <path class="ar" d="M300,100 L336,100"/>
  <text class="s" x="318" y="88" text-anchor="middle">C</text>
  <!-- H -->
  <rect x="340" y="40" width="190" height="120" rx="10" fill="#B509AC" fill-opacity=".15" stroke="#B509AC" stroke-width="2"/>
  <text class="t" x="435" y="64" text-anchor="middle">Hypernetwork  H_φ</text>
  <text class="s" x="435" y="86" text-anchor="middle">per layer ℓ:</text>
  <text class="s" x="435" y="102" text-anchor="middle">encoder resampler</text>
  <text class="s" x="435" y="118" text-anchor="middle">→ decoder resampler</text>
  <text class="s" x="435" y="134" text-anchor="middle">→ shared projection head</text>
  <text class="s" x="435" y="152" text-anchor="middle" fill="#B509AC" opacity="1">the only trained part</text>
  <path class="flow" d="M530,100 L566,100"/>
  <text class="s" x="548" y="88" text-anchor="middle">θ(v)</text>
  <!-- F -->
  <rect x="570" y="40" width="160" height="120" rx="10" fill="#9a9a9a" fill-opacity=".15" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="t" x="650" y="68" text-anchor="middle">Answer model  F</text>
  <text class="s" x="650" y="88" text-anchor="middle">same frozen SmolVLM2</text>
  <rect x="600" y="100" width="100" height="24" rx="6" fill="#B509AC" fill-opacity=".2" stroke="#B509AC"/>
  <text class="s" x="650" y="116" text-anchor="middle">+ {A_ℓ, B_ℓ}</text>
  <text class="s" x="650" y="146" text-anchor="middle">on down_proj; no visual tokens</text>
  <rect x="570" y="200" width="160" height="40" rx="8" fill="#2698BA" fill-opacity=".15" stroke="#2698BA" stroke-width="1.5"/>
  <text class="t" x="650" y="225" text-anchor="middle">text prompt  p</text>
  <path class="ar" d="M650,200 L650,164"/>
  <path class="ar" d="M730,100 L766,100"/>
  <rect x="770" y="70" width="110" height="60" rx="10" fill="#00ab37" fill-opacity=".15" stroke="#00ab37" stroke-width="1.5"/>
  <text class="t" x="825" y="96" text-anchor="middle">output  y</text>
  <text class="s" x="825" y="116" text-anchor="middle">token by token</text>
  <!-- teacher and loss -->
  <rect x="20" y="200" width="200" height="60" rx="10" fill="#9a9a9a" fill-opacity=".15" stroke="#9a9a9a" stroke-width="1.5"/>
  <text class="t" x="120" y="224" text-anchor="middle">Frozen teacher</text>
  <text class="s" x="120" y="244" text-anchor="middle">same SmolVLM2, sees the frames</text>
  <path class="ar" d="M75,130 L75,198"/>
  <path class="ar" d="M220,230 L300,230"/>
  <rect x="304" y="200" width="200" height="60" rx="10" fill="#F29105" fill-opacity=".12" stroke="#F29105" stroke-width="1.5"/>
  <text class="t" x="404" y="224" text-anchor="middle">Cross-entropy loss</text>
  <text class="s" x="404" y="244" text-anchor="middle">teacher caption vs. y, teacher-forced</text>
  <path class="ar" d="M825,130 L825,274 L404,274 L404,262"/>
  <path class="grad" d="M404,200 L404,164"/>
  <text class="s" x="450" y="308" text-anchor="middle" fill="#F29105" opacity="1">training: gradients update φ only; E, F and the teacher stay frozen.  At inference the teacher and the loss disappear.</text>
</svg>
<div class="fig-caption">The full loop. Only the hypernetwork receives gradients; the encoder, the answer model and the teacher are the same frozen SmolVLM2.</div>
</div>

Two details in the hypernetwork matter more than they look. First, the Perceiver bottleneck is what makes frame count a free variable: the latent queries produce a fixed-size summary whether $$S$$ covers 8 frames or 1,024, which is why a model trained only at 12 frames and 384 px can be run at 1,024 frames and 1024 px. Second, the zero-initialized $$\mathbf{B}$$ scale means training starts from the base model's behavior and learns a perturbation, rather than starting from a random adapter that has to be unlearned. Training data are spans from FineVideo, mixed 60/30/10 across single-scene, adjacent multi-scene and full-video spans, with audio excluded.

The finding I did not expect is that adapters compose in rank space. Split a video into two temporal halves, internalize each independently, and concatenate the two rank-16 adapters along the rank dimension. Nothing in training ever saw a composed adapter, yet on VDC the composed adapter keeps 93.1% of the single-video adapter's mean token-F1 at 500M (0.206 vs 0.221) and 86.2% at 2.2B (0.211 vs 0.245), and it produces coherent video-level captions rather than text tied to one half.

<div class="tok-row"><span class="tok tok-b">first half</span><span class="tok-arrow">→</span><span class="tok tok-a">θ(v₁), rank 16</span><span class="tok-arrow">⊕</span><span class="tok tok-b">second half</span><span class="tok-arrow">→</span><span class="tok tok-a">θ(v₂), rank 16</span><span class="tok-arrow">=</span><span class="tok tok-c">composed adapter, rank 32</span></div>

The rank directions are redundant but not interchangeable. Ranking each rank slice by the product of its factor norms and keeping only the top 8 gives 0.1264 token-F1 on ActivityNet Captions, against 0.1262 for the full rank-16 adapter, while the lowest-scoring single slice lands below the zero-adapter baseline. The ordering is the same in every one of 500 examples (direction R11 always scores highest), which suggests the hypernetwork has learned a fixed coordinate system for its output. Layer-wise removal on the 2.2B model adds that the updates whose removal hurts most sit in the later layers, close to the output logits.

## What the numbers say

- **Quality holds.** On all five captioning benchmarks (ActivityNet Captions, PLM-RDCap, PLM-RCap, VDC, CaReBench), at both 500M and 2.2B, Frames2LoRA is statistically non-inferior and equivalent to video-in-context inference under an LLM judge (Spearman 0.823 with human ratings), recovering 91.9% of the base judge score at 2.2B and 84.2% at 500M. Video QA was never trained on, yet 7 of 8 benchmark-scale pairings pass, and on NExT-QA the adapter beats the base at both scales.
- **Queries get cheap.** Across a sweep of 8 to 1,024 frames and 224 to 1024 px, query TTFT falls by a geometric mean of 6.7x at 500M and 20.1x at 2.2B (maximum 79.1x), and answer-time input tokens fall by 150x and 302x on average, reaching 713x and 1,507x.
- **It survives where in-context inference does not.** Trained at 12 frames, the model stays stable through 1,024 frames and 1024 px (average token-F1 change of -0.012 at 500M). At 1024 px and high frame counts direct inference degenerates into repetitive output and Frames2LoRA leads by +0.12 to +0.13 token-F1.

## Try it

- Paper page on this site: [/papers/frames2lora/](/papers/frames2lora/)
- arXiv: [2606.04351](https://arxiv.org/abs/2606.04351)
- Code: [github.com/frames2lora/Frames2LoRA](https://github.com/frames2lora/Frames2LoRA)
- Checkpoints: [Frames2LoRA-SmolVLM-ckpts on Hugging Face](https://huggingface.co/MananSuri27/Frames2LoRA-SmolVLM-ckpts)
- Project page with the qualitative-example explorer: [frames2lora.github.io](https://frames2lora.github.io/)
- The audio-visual follow-up: [Omni2LoRA](/papers/omni2lora/)
