import { FC, ReactNode } from "react";
import { Header } from "../components";
import "./MainLayout.css";
interface Props {
  children: ReactNode;
}
export const MainLayout: FC<Props> = ({ children }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};
