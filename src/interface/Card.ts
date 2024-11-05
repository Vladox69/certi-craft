import { ReactNode } from "react";

export interface Card{
    title:string;
    description:string;
    icon:ReactNode;
    to:string;
}