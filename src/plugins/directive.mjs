import { visit } from 'unist-util-visit';

export function remarkCustomDirective() {
  return (tree) => {
    // Markdownの構文ツリーから directive（独自記法）を探す
    visit(tree, (node) => {
      // コンテナ型 (:::)、リーフ型 (::)、テキスト型 (:) のディレクティブを対象とする
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        // ディレクティブの名前が 'quote' でない場合は無視
        if (node.name !== 'quote') return;

        // HTMLに変換する際のタグと属性を設定
        const data = node.data || (node.data = {});
        data.hName = 'blockquote'; // タグとして出力
        data.hProperties = {
          className: ['custom-quote'] // CSSで装飾しやすいようにクラスを付与
        };
      }
    });
  };
}