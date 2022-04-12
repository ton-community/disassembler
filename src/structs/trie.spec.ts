import { Trie } from './trie'

it('should insert and find', () => {
    let trie = new Trie<{ kek: boolean }>();
    trie.insert('test', { kek: false });


    let result = trie.contains('test');
    expect(result).toBeTruthy();

    expect(trie.find('te')).toStrictEqual(['test']);

    trie.insert('lol', { kek: true });
    expect(trie.find('tes')).toStrictEqual(['test']);

    expect(trie.getValue('lol')).toMatchObject({ kek: true });
    expect(trie.getValue('lo')).toBe(null);
})

it('should throw if same prefix used', () => {
    let trie = new Trie<{ kek: boolean }>();
    trie.insert('test', { kek: false });

    expect(() => {
        trie.insert('te', { kek: true })
    }).toThrow();
})