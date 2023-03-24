class TrieNode<T> {
    public parent: TrieNode<T> | null = null
    public children: { [key: string]: TrieNode<T> } = {}
    public end: boolean = false

    constructor(public readonly key: string | null, public value: T | null) { }

    getWord() {
        var output = [];
        var node: TrieNode<T> | null = this;

        while (node !== null) {
            output.unshift(node.key);
            node = node.parent;
        }

        return output.join('');
    };
}

function findAllWords(node: TrieNode<any>, arr: string[], maxOccurencies: number = -1) {
    // base case, if node is at a word, push to output
    if (node.end) {
        arr.unshift(node.getWord());
    }

    if (maxOccurencies !== -1 && arr.length >= maxOccurencies) {
        return;
    }

    // iterate through each children, call recursive findAllWords
    for (var child in node.children) {
        findAllWords(node.children[child], arr, maxOccurencies);
    }
}
export class Trie<T> {
    public root: TrieNode<T> = new TrieNode<T>(null, null);

    insert(word: string, value: T) {
        var node = this.root;

        for (var i = 0; i < word.length; i++) {
            if (node.end) {
                console.log(node.getWord(), node.value);
                throw new Error('Word cannot start with already used prefix');
            }

            if (!node.children[word[i]]) {
                node.children[word[i]] = new TrieNode<T>(word[i], null);
                node.children[word[i]].parent = node;
            }
            
            node = node.children[word[i]];

            // finally, we check to see if it's the last word.
            if (i == word.length - 1) {
                if (Object.entries(node.children).length > 0) {
                    console.log(node.getWord(), this.find(node.getWord()));
                    throw new Error('Word cannot start with already used prefix');
                }

                // if it is, we set the end flag to true.
                node.end = true;
                node.value = value;
            }
        }
    }

    contains(word: string) {
        var node = this.root;

        for (var i = 0; i < word.length; i++) {
            if (node.children[word[i]]) {
                node = node.children[word[i]];
            } else {
                return false;
            }
        }
        return node.end;
    }

    find(prefix: string, maxOccurencies: number = -1) {
        var node = this.root;
        var output: string[] = [];

        for (var i = 0; i < prefix.length; i++) {
            if (node.children[prefix[i]]) {
                node = node.children[prefix[i]];
            } else {
                return output;
            }
        }

        findAllWords(node, output, maxOccurencies);

        return output;
    }

    getValue(key: string): T | null {
        var node = this.root;

        for (var i = 0; i < key.length; i++) {
            if (node.children[key[i]]) {
                node = node.children[key[i]];
            } else {
                return null;
            }
        }
        if (!node.end) {
            return null;
        }
        return node.value;
    }
}
