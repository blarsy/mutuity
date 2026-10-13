import { Container, type ContainerProps } from "@mui/material";

export type PageContainerProps = Omit<ContainerProps, "maxWidth">;

export function PageContainer(props: PageContainerProps) {
  return <Container {...props} maxWidth="lg" />;
}
