declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '@shopify/polaris/build/esm/styles.css' {
  const content: string;
  export default content;
}
