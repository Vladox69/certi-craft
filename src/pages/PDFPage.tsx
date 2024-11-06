import { ChangeEvent, useState } from "react";
import "./PDFPage.css";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";
import {
  Box,
  Button,
  Container,
  Step,
  StepContent,
  StepLabel,
  Stepper,
} from "@mui/material";
GlobalWorkerOptions.workerSrc =
  "../../node_modules/pdfjs-dist/build/pdf.worker.mjs";

export const PDFPage = () => {
  const [file, setFile] = useState<File>();
  const [activeStep, setActiveStep] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (target.files && target.files.length == 0) return;
    setFile(target.files?.[0]);
  };

  const getContentPage = async (doc: PDFDocumentProxy, index: number) => {
    const page = await doc.getPage(index);
    const content = await page.getTextContent();
    return content;
  };

  const loadPDF = async () => {
    const loadingTask = getDocument(URL.createObjectURL(file!));
    const pdfjsDoc = await loadingTask.promise;
    const pdfLibDoc = await PDFDocument.load(await file!.arrayBuffer());

    const numPages = pdfjsDoc._pdfInfo.numPages;

    const pageContentPromise: Promise<unknown>[] = [];
    for (let index = 0; index < numPages; index++) {
      pageContentPromise.push(getContentPage(pdfjsDoc, index + 1));
    }
    const pageContent = await Promise.all(pageContentPromise);

    pageContent.map((page, index) => {
      const pdfLibPage = pdfLibDoc.getPage(index);
      page.items.map((item) => {
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
      });
    });
    const pdfBytes = await pdfLibDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob)
    setPdfUrl(url)
  };
  return (
    <Container>
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Primer paso carga de archivo */}
        <Step key={1}>
          <StepLabel>Cargar archivo</StepLabel>
          <StepContent>
            <Box>
              <input
                type="file"
                className="m-2"
                onChange={onFileInputChange}
                accept=".pdf"
              />
              <Button variant="contained" color="error" onClick={loadPDF}>
                Cargar
              </Button>
            </Box>
            <Box>
              <Button variant="contained" onClick={handleNext} >
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step key={2}>
          <StepLabel>Textos encontrados</StepLabel>
          <StepContent>
            <Box>
            <iframe src={pdfUrl} width="100%" height="600px" title="PDF Viewer" />
            </Box>
            <Box>
              <Button variant="contained" onClick={handleNext} >
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step key={3}>
          <StepLabel>Selección de textos para sustituir</StepLabel>
          <StepContent>
            <Box>
            </Box>
            <Box>
              <Button variant="contained" onClick={handleNext} >
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </Container>
  );
};
