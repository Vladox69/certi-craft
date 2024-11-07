import { ChangeEvent, useState } from "react";
import "./PDFPage.css";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";
import {
  Box,
  Button,
  Checkbox,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
GlobalWorkerOptions.workerSrc =
  "../../node_modules/pdfjs-dist/build/pdf.worker.mjs";

interface Font {
  name: string;
  size: number;
}

interface ItemText {
  id?: string;
  text: string;
  width: number;
  height: number;
  x: number;
  y: number;
  font: Font;
  field:string;
}

export const PDFPage = () => {
  const [file, setFile] = useState<File>();
  const [activeStep, setActiveStep] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");
  const [items, setItems] = useState<ItemText[]>([]);
  const [itemsSelected, setItemsSelected] = useState<ItemText[]>([])
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [textFieldValues, setTextFieldValues] = useState<{
    [key: string]: string;
  }>({});

  const handleCheckboxChange = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleTextFieldChange = (id: string, value: string) => {
    setTextFieldValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleAccept = () => {
    const updatedItems:ItemText[] = items.map((item) => {
      if (selectedItems[item.id!]) { // Si el checkbox está seleccionado
        return {
          ...item,
          field: textFieldValues[item.id!] || "", // Actualiza `field` con el valor del `TextField`
        };
      }
      return item;
    });
    setItemsSelected(updatedItems)
  };

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

  const underlineText = async (pageContent: unknown) => {
    const pdfLibDoc = await PDFDocument.load(await file!.arrayBuffer());
    pageContent.map((page, index) => {
      const pdfLibPage = pdfLibDoc.getPage(index);
      buildText(page);
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
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  const buildText = (page: unknown) => {
    const { items, styles } = page;
    items.map((item) => {
      const fontProps = styles[item.fontName];
      const newItem: ItemText = {
        id: uuidv4(),
        text: item.str,
        width: item.width,
        height: item.height,
        x: item.transform[4],
        y: item.transform[5],
        font: {
          name: fontProps.fontFamily,
          size: Math.abs(item.transform[3]),
        },
        field:""
      };
      if (item.str != "") {
        setItems((prevItems) => [...prevItems, newItem]);
      }
    });
  };

  const loadPDF = async () => {
    const loadingTask = getDocument(URL.createObjectURL(file!));
    const pdfjsDoc = await loadingTask.promise;

    const numPages = pdfjsDoc._pdfInfo.numPages;

    const pageContentPromise: Promise<unknown>[] = [];
    for (let index = 0; index < numPages; index++) {
      pageContentPromise.push(getContentPage(pdfjsDoc, index + 1));
    }
    const pageContent = await Promise.all(pageContentPromise);
    underlineText(pageContent);
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
              <Button variant="contained" onClick={handleNext}>
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step key={2}>
          <StepLabel>Textos encontrados</StepLabel>
          <StepContent>
            <Box>
              <iframe
                src={pdfUrl}
                width="100%"
                height="600px"
                title="PDF Viewer"
              />
            </Box>
            <Box>
              <Button variant="contained" onClick={handleNext}>
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step key={3}>
          <StepLabel>Selección de textos para sustituir</StepLabel>
          <StepContent>
            <Box>
              <List>
                {items.map((item) => {
                  const labelId = `checkbox-list-label-${item.id}`;
                  return (
                    <ListItem
                      key={item.id}
                      role={undefined}
                      // secondaryAction={
                      //   <TextField
                      //     id="outlined-basic"
                      //     label="Campo"
                      //     variant="outlined"
                      //   />
                      // }
                      // disablePadding
                    >
                      <ListItemButton>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={!!selectedItems[item.id!]}
                            tabIndex={-1}
                            disableRipple
                            inputProps={{ "aria-labelledby": labelId }}
                            onChange={() => handleCheckboxChange(item.id!)}
                          />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={`${item.text}`} />
                        <TextField
                          id="outlined-basic"
                          label="Campo"
                          variant="outlined"
                          value={textFieldValues[item.id!] || ""}
                          onChange={(e) =>
                            handleTextFieldChange(item.id!, e.target.value)
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
            <Box>
              <Button variant="contained" onClick={handleNext}>
                Siguiente
              </Button>
              <Button variant="contained" onClick={handleBack}>
                Atras
              </Button>
              <Button variant="contained" onClick={handleAccept}>
                Aceptar
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </Container>
  );
};
