# Yet Another Type Compiler-Compiler

生成一个解析字符串类型。

[示例](./example/index.ts)

```ts
type T = E<`(1 + 2) * 3 + 4 * 5`>
//   ^? type T = 29
```