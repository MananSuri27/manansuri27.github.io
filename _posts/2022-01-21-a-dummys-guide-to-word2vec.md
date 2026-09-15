---
layout: post
title: "A Dummy's Guide to Word2Vec"
description: "What word embeddings are, how Word2Vec learns them (CBOW and skip-gram), and how to train, probe, and visualise your own with Gensim."
date: 2022-01-21 12:06:00
tags: nlp embeddings tutorial
categories: tutorials
featured: false
thumbnail: assets/img/blog/word2vec/cover.jpg
related_posts: false
toc:
  beginning: true
---

*Originally published on [Medium](https://medium.com/@manansuri/a-dummys-guide-to-word2vec-456444f3c673) in January 2022; migrated and lightly updated in September 2026. The code has been updated for Gensim 4 (`size` → `vector_size`, `iter` → `epochs`, `wv.vocab` → `wv.index_to_key`), and a short postscript on what Word2Vec still teaches us in the LLM era has been added at the end.*

{% include figure.html path="assets/img/blog/word2vec/cover.jpg" class="img-fluid rounded z-depth-1" zoomable=true alt="Word2Vec cover illustration" %}

I have always been interested in learning different languages, though the only French the Duolingo owl has taught me is *Je m'appelle Manan*. My short stints at learning a third language helped me realise that vocabulary is not sufficient: contexts, semantics and syntactic features are also important to truly grasp meaning from a language. So when I started doing NLP tasks, I felt perplexed about how something like a bag-of-words, which considers each word in a very independent light, could really be effective. I got answers to this question when I learnt what word embeddings are and how they work. In this article, I'm going to talk about word embeddings, specifically the Word2Vec model, and how to take advantage of it using the easy-to-use Gensim library.

## Word embeddings

The emergence of language was a pivotal moment in the evolution of humanity. Although all species have their ways of communicating, we as humans are unique in having mastered cognitive language communication. So while I know that "rat" refers to a small hairy rodent, my dog or my computer (at least in essence) doesn't know that.

Therefore, any task aimed at processing language must first begin with how to represent words.

A preliminary method is a "bag of words" model which encodes words using a one-hot scheme. If our dataset contains the sentences:

> "I like the new movie!", "I love the weather."

{% include figure.html path="assets/img/blog/word2vec/bag-of-words.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Visualising the bag-of-words representation" alt="Bag-of-words one-hot table" %}

Then we can have a vector representation of the words as:

```
I       [1,0,0,0,0,0,0]
like    [0,1,0,0,0,0,0]
the     [0,0,1,0,0,0,0]
new     [0,0,0,1,0,0,0]
movie   [0,0,0,0,1,0,0]
love    [0,0,0,0,0,1,0]
weather [0,0,0,0,0,0,1]
```

The sentences will then be represented as `[1,1,1,1,1,0,0]` and `[1,0,1,0,0,1,1]`.

However, as you might have noticed, this representation is not very effective at showing the semantic and syntactic relationships between words. They are encoded as individual bits in a vector space, and there is no way you can tell that the words "love" and "like" have a similar connotation.

This is where word embeddings come in. Word embeddings are representations where contexts and similarities are captured by encoding in a vector space: similar words have similar representations. We're going to discuss Word2Vec, which is an effective word embedding technique.

## Word2Vec

Word2Vec creates a representation of each word in our vocabulary as a vector. Words used in similar contexts, or having semantic relationships, are captured through their closeness in the vector space. Effectively, similar words will have similar word vectors! Word2Vec was created, patented, and published in 2013 by a team of researchers led by Tomas Mikolov at Google.

Let us consider a classic example: "king", "queen", "man", "girl", "prince".

{% include figure.html path="assets/img/blog/word2vec/hypothetical-features.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Hypothetical features to understand word embeddings" alt="Table of hypothetical feature weights for king, queen, man, girl, prince" %}

In a hypothetical world, vectors could define the weight of each criterion (for example royalty, masculinity, femininity, age) for each of the words in our vocabulary. What we then observe is:

- As expected, "king", "queen", "prince" have similar scores for "royalty", and "girl", "queen" have similar scores for "femininity".
- An operation that removes "man" from "king" would yield a vector very close to "queen" ("king" − "man" = "queen").
- Vectors "king" and "prince" have the same characteristics except for age, telling us how they might be semantically related to each other.

Word2Vec forms word embeddings that work in a similar fashion, except that the criteria used for each word are not clearly determinable. What matters to us is the semantic and syntactic relations between words, which can still be determined by our model without explicitly defining features for units of the vector.

Word2Vec has also been shown to identify relations like country–capital over larger datasets, showing how powerful word embeddings can be. Embeddings generated by Word2Vec can further be used in NLP tasks, such as feeding them into a CNN to classify text.

### Model architecture

Word2Vec is essentially a shallow, 2-layer neural network.

- The input contains all the documents/texts in our training set. For the network to process these texts, they are represented as one-hot encodings of the words.
- The number of neurons in the hidden layer equals the length of the embedding we want. That is, if we want all our words to be vectors of length 300, then the hidden layer will contain 300 neurons.

{% include figure.html path="assets/img/blog/word2vec/network-training.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Understanding the neural network training of the Word2Vec model" alt="Diagram of the two-layer Word2Vec network" %}

- The output layer contains probabilities for a target word (given an input to the model, what word is expected).
- At the end of the training process, the hidden weights are treated as the word embedding. Intuitively, this can be thought of as each word having a set of *n* weights (300 in the example above) "weighing" their different characteristics, the analogy we used earlier.

{% include figure.html path="assets/img/blog/word2vec/weight-matrix-lookup.png" class="img-fluid rounded z-depth-1" zoomable=true caption="The weight matrix of the hidden layer ends up becoming a lookup table for the given words and their vector representations" alt="Hidden-layer weight matrix as a lookup table" %}

There are two ways in which we can develop these embeddings.

**1. Continuous Bag-Of-Words (CBOW).** CBOW predicts the target word based on its surrounding words. For example, consider the sentence "The cake was chocolate flavoured". The model will iterate over this sentence for different target words, such as "The ____ was chocolate flavoured" being the input and "cake" being the target word. CBOW thus smoothes over the distribution of the information, as it treats the entire context as one observation. CBOW is faster than skip-gram and works well with frequent words.

**2. Skip-gram.** Skip-gram works in the exact opposite way to CBOW. Here we take an input word and expect the model to tell us what words it is expected to be surrounded by. Taking the same example, with "cake" we would expect the model to give us "The", "was", "chocolate", "flavoured". The statistical interpretation of this is that we treat each context–target pair as a new observation. Skip-gram works well with small datasets and can better represent less frequent words.

{% include figure.html path="assets/img/blog/word2vec/cbow-skipgram.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Training CBOW and skip-gram for Word2Vec" alt="CBOW versus skip-gram training diagram" %}

## Using Gensim to train our own embeddings

We can easily train Word2Vec embeddings using [Gensim](https://radimrehurek.com/gensim/), which is "a free open-source Python library for representing documents as semantic vectors, as efficiently (computer-wise) and painlessly (human-wise) as possible."

The dataset I used for this demo is the [Coronavirus tweets NLP dataset](https://www.kaggle.com/datatattle/covid-19-nlp-text-classification) from Kaggle. I am omitting the parts involving loading the dataset and preprocessing the text, but you can check out the complete implementation in this [Colab notebook](https://colab.research.google.com/drive/1YkSrvfWR_EBFFrhV5E15Z6k5es4Kluom?usp=sharing). I preferred this over larger datasets like IMDB because many real applications involve similar-sized datasets, so it makes for a better representation of the model's average performance.

### 1. Training the embeddings

We import `Word2Vec` from `gensim.models`. Each input to the model must be a list of tokens, so we generate the input by calling `split()` on each line in our corpus of texts.

```python
from gensim.models import Word2Vec

sentences = [line.split() for line in texts]

w2v = Word2Vec(sentences, vector_size=100, window=5, workers=4, epochs=10, min_count=5)

print(sentences[20:25])
# [['with', 'nations', 'inficted', 'with', 'covid', 'the', 'world', 'must', 'not', 'play', 'fair', ...
```

We then set up the model and specify different parameters. Briefly, what they mean:

- `vector_size` (called `size` in Gensim 3) is the size of the word embedding it will output.
- `window` is the maximum distance between the current and predicted word within a sentence.
- `min_count` sets a minimum frequency for a word to be part of the model; all words with count less than `min_count` are ignored.
- `workers` is the number of worker threads used to train the model. This can be adjusted to the number of cores your system has. In simple words, it is the parallelism while training.
- `epochs` (called `iter` in Gensim 3) is the number of passes over the corpus during training.

### 2. Using the Word2Vec model

Finding the vocabulary of the model can be useful in several general applications, and in this case it gives us a list of words we can try with the other functions.

```python
words = list(w2v.wv.index_to_key)   # w2v.wv.vocab in Gensim 3
print(words)
# ['phil', 'advice', 'talk', 'to', 'your', 'neighbours', 'family', 'exchange', 'phone', 'numbers', ...
```

Finding the embedding of a given word is useful when we're trying to represent sentences as a collection of word embeddings, like when building a weight matrix for the embedding layer of a network. I include this so it can help your intuition of what a word vector looks like.

```python
print(w2v.wv['computer'])
# [ 1.57469660e-01  1.40157074e-01 -3.25907797e-01 -6.61702231e-02
#   3.14891905e-01  6.28795177e-02 -4.47840840e-02  4.59685735e-02
#   ...  (100 values)
```

As you can see, it is not possible to make sense of what these individual values mean, unlike the completely hypothetical example I gave above.

We can also find the similarity between given words (the cosine similarity between their vectors). Here we compare "vladimir" with "putin" and with "modi", and a stark distinction exists.

```python
w2v.wv.similarity('vladimir', 'putin')
# 0.81842446

w2v.wv.similarity('vladimir', 'modi')
# 0.6622772
```

With Gensim we can also find the most similar words to a given word. This particularly shows the contextualising power of the model. Look at words similar to "covid": we get "coronavirus", "virus", "corona", "disease" as the top words. When we try "india", we get a list of words that are also countries! When we try a verb such as "pay", we get other forms of the same verb, "paid", "paying", and associated terms like "wages" and "bills". This is exciting considering our vocabulary is not very large and the dataset covers a very specific situation.

```python
print(w2v.wv.most_similar('pay'))
# [('paying', 0.702), ('paid', 0.686), ('wages', 0.651), ('bills', ...), ...]

print(w2v.wv.most_similar('covid'))
# [('coronavirus', 0.603), ('virus', 0.529), ('corona', 0.507), ...]

print(w2v.wv.most_similar('india'))
# [('nigeria', 0.753), ('pakistan', 0.751), ('kenya', 0.683), ...]
```

Similarly, we can use the same function to find analogies of the form *if x : y, then z : ?*. We enter the known relation in the `positive` parameter and the term whose analogue we want in the `negative` parameter. Here our model seems to have learnt something about nationalities: if "russian" → "russia", then "arab" → "saudi", "arabia" (taking the first two terms, because the model did not treat multi-word phrases as single tokens).

```python
print(w2v.wv.most_similar(positive=['russian', 'russia'], negative=['arab']))
# [('saudi', 0.798), ('arabia', 0.774), ('putin', 0.735), ...]
```

There is also a method that works like an "odd one out" puzzle. Here the model identifies "grocery" as different from "covid" and "coronavirus".

```python
w2v.wv.doesnt_match(['grocery', 'covid', 'coronavirus'])
# 'grocery'
```

### 3. Visualising word embeddings

Word2Vec embeddings are usually of size 100 or 300, and it is not practical to visualise a 100- or 300-dimensional space meaningfully. I used a snippet from [Stanford's CS224N course site](http://web.stanford.edu/class/cs224n/materials/Gensim%20word%20vector%20visualization.html), which lets you either pass a list of words or a number of random samples to display. In either case, it uses PCA to reduce the dimensionality and plots the words on a 2-dimensional plane. The actual axis values hold no significance; what we can see is that similar vectors are densely located with respect to each other.

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

def display_pca_scatterplot(model, words=None, sample=0):
    if words is None:
        words = list(model.wv.index_to_key) if sample == 0 else \
                np.random.choice(list(model.wv.index_to_key), sample, replace=False)
    word_vectors = np.array([model.wv[w] for w in words])
    twodim = PCA().fit_transform(word_vectors)[:, :2]

    plt.figure(figsize=(6, 6))
    plt.scatter(twodim[:, 0], twodim[:, 1], edgecolors='k', c='r')
    for word, (x, y) in zip(words, twodim):
        plt.text(x + 0.05, y + 0.05, word)

display_pca_scatterplot(w2v, ['coronavirus', 'covid', 'virus', 'corona', 'disease',
                              'saudiarabia', 'doctor', 'hospital', 'pakistan', 'kenya',
                              'pay', 'paying', 'paid', 'wages', 'raise', 'bills', 'rent', 'charge'])
```

On the graph, you can see how "coronavirus", "covid", "virus" form one group, separate from the others, while "paying", "paid", "bills", "wages" are in another group altogether. Similarly, the countries "saudiarabia", "kenya", "pakistan" form one very dense cluster.

{% include figure.html path="assets/img/blog/word2vec/pca-plot.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Reducing dimensionality with PCA and visualising the given words" alt="PCA scatter plot of selected word vectors" %}

### 4. Saving models, and using pre-trained models

Gensim ships with several pre-trained models in the `gensim-data` repository. We can import the downloader from the Gensim library and print the list of available pre-trained models. This also includes models like GloVe and fastText, not only Word2Vec.

```python
import gensim.downloader

print(list(gensim.downloader.info()['models'].keys()))
# ['fasttext-wiki-news-subwords-300', 'conceptnet-numberbatch-17-06-300',
#  'word2vec-ruscorpora-300', 'word2vec-google-news-300', 'glove-wiki-gigaword-50', ...]
```

Here we use `word2vec-google-news-300` (trained on Google News, with 300-dimensional vectors) and find words similar to "twitter".

```python
google_news = gensim.downloader.load('word2vec-google-news-300')
google_news.most_similar('twitter')
# [('Twitter', 0.891), ('Twitter.com', 0.754), ('tweet', 0.743), ('tweeting', 0.716),
#  ('tweeted', 0.714), ('facebook', 0.699), ('tweets', 0.697), ...]
```

We can save our trained models, load them again, and even continue training them.

```python
w2v.save("word2vec.model")

model = Word2Vec.load("word2vec.model")
model.train([["hello", "world"]], total_examples=1, epochs=1)
```

## Summary

- Word embeddings are a better way to represent natural language than a skeletal bag-of-words. They capture the semantic and syntactic relationships present in text.
- Word2Vec represents each word in our vocabulary as a vector, so that similar words have similar word vectors.
- Word2Vec embeddings can be trained in two ways: CBOW predicts the target word from its surrounding words; skip-gram does the opposite, predicting surrounding words for a given input word.
- We can easily train Word2Vec embeddings using Gensim, a free open-source Python library, on our own corpus, or use pre-trained embeddings.
- Gensim provides functions for working with embeddings, including finding similar words, computing similarities, and solving analogies.
- The Gensim downloader gives easy access to embeddings trained on large datasets like Google News. We can save our trained models and continue training them later.

Code: [Colab notebook](https://colab.research.google.com/drive/1YkSrvfWR_EBFFrhV5E15Z6k5es4Kluom?usp=sharing)

## Postscript (2026): what Word2Vec got right that we forgot in the LLM era

Four years after writing this, I spend most of my time on LLM agents, and it is easy to treat Word2Vec as a museum piece. It isn't. A few things it got right that are worth remembering:

- **The distributional hypothesis is still the whole game.** "You shall know a word by the company it keeps" is exactly what a transformer's next-token objective optimises, just with a much bigger context window and a much bigger model. Word2Vec was the cleanest possible demonstration that predicting neighbours is enough to learn meaning. Everything since is scaling that same idea.
- **Static embeddings are underrated.** A lookup table is the cheapest model there is: no forward pass, no GPU, no latency. For retrieval pre-filtering, deduplication, vocabulary analysis, or anything that runs millions of times, a good static embedding is often the right tool, and modern "static" models distilled from LLMs bring most of the quality at a tiny fraction of the cost.
- **Efficiency was a design goal, not an afterthought.** Negative sampling, hierarchical softmax, and subsampling of frequent words exist because Mikolov's team wanted to train on billions of tokens on a CPU. That mindset, do the simplest thing that scales, is one I keep coming back to when thinking about how agents should hold context without paying for it on every query.
- **Probing the geometry is how you build intuition.** `most_similar`, analogies, and `doesnt_match` are toy tools, but they teach you to ask "what has this model actually learnt?" That habit transfers directly to interpreting, attributing, and trusting what large models produce.

## References / further reading

- [Word2Vec explained](https://israelg99.github.io/2017-03-23-Word2Vec-Explained/)
- [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/) by Jay Alammar
- [Gensim Word2Vec tutorial](https://www.kaggle.com/pierremegret/gensim-word2vec-tutorial) on Kaggle
- [Word2Vec demo](https://remykarem.github.io/word2vec-demo/)
- Mikolov et al., [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781) (2013)
