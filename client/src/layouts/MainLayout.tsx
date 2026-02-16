import { ReactNode } from "react";
import Navbar from "../components/common/Navbar";

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props): JSX.Element {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
