import { ChangeEvent, useState } from "react";
import "./PDFPage.css";
import { getDocument,GlobalWorkerOptions } from "pdfjs-dist";
GlobalWorkerOptions.workerSrc="../../node_modules/pdfjs-dist/build/pdf.worker.mjs"
export const PDFPage = () => {
  const [file, setFile] = useState<File>();

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (target.files && target.files.length == 0) return;
    setFile(target.files?.[0]);
  };
  const loadPDF = async () => {
    const loadingTask=getDocument(URL.createObjectURL(file!))
    const pdf = await loadingTask.promise
    console.log(pdf);
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
    </div>
  );
};
