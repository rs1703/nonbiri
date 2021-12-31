declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.less" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

type Dispatcher<T = any> = React.Dispatch<React.SetStateAction<T>>;
type Props<T = any> = React.DetailedHTMLProps<React.HTMLAttributes<T>, T>;

declare interface Mutable<T> {
  current: T;
}

declare const If: (props: { condition: boolean; children?: React.ReactNode }) => JSX.Element;
