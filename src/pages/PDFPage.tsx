import { ChangeEvent, useState } from "react";
import "./PDFPage.css";
import { getDocument,GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "primereact/button";
GlobalWorkerOptions.workerSrc="../../node_modules/pdfjs-dist/build/pdf.worker.mjs"

export const PDFPage = () => {
  const [file, setFile] = useState<File>();

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (target.files && target.files.length == 0) return;
    setFile(target.files?.[0]);
  };

  const getContentPage=async(doc: PDFDocumentProxy,index:number)=>{
    const page = await doc.getPage(index)
    const content = await page.getTextContent();
    return content; 
  }

  const loadPDF = async () => {
    
    const loadingTask=getDocument(URL.createObjectURL(file!))
    const pdfjsDoc = await loadingTask.promise;
    const pdfLibDoc = await PDFDocument.load(await file!.arrayBuffer()); 


    const numPages = pdfjsDoc._pdfInfo.numPages;

    const pageContentPromise:Promise<unknown>[]=[];
    for (let index = 0; index < numPages; index++) {
      pageContentPromise.push(getContentPage(pdfjsDoc,index+1))
    }
    const pageContent=await Promise.all(pageContentPromise)
    
    pageContent.map((page,index)=>{
      const pdfLibPage = pdfLibDoc.getPage(index);
      page.items.map((item)=>{
        const { str, width, height, transform } = item;
        const x = transform[4];
        const y = transform[5];
        pdfLibPage.drawRectangle({
          x: x,
          y: y,
          width: width,
          height: height,
          color: rgb(1, 1, 0), 
          opacity: 0.3,
        });
      })
    })
    const pdfBytes = await pdfLibDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url);
  };
  return (
    <div>
      <input
        type="file"
        className="m-2"
        onChange={onFileInputChange}
        accept=".pdf"
      />
      <button className="btn btn-danger" onClick={loadPDF}>
        Cargar
      </button>
      <Button label="Check" icon="pi pi-check" />
    </div>
  );
};
