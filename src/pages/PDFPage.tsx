import { ChangeEvent, FC, useState } from "react";
import "./PDFPage.css";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
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
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretSquareDown,
  faCaretSquareUp,
  faCircleDown,
} from "@fortawesome/free-regular-svg-icons";
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
  field: string;
}

interface ItemData {
  [key: string]: unknown[];
}

interface CustomListItemProps {
  keyProps: string;
  data: unknown[];
}

const CustomListItem: FC<CustomListItemProps> = ({ keyProps, data }) => {
  const [open, setOpen] = useState(true);

  const handleClick = () => {
    setOpen(!open);
  };
  return (
    <>
      <ListItem>
        <ListItemButton onClick={handleClick}>
          <ListItemIcon>
            <Checkbox
              edge="start"
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": keyProps }}
            />
          </ListItemIcon>
          <ListItemText id={keyProps} primary={`${keyProps}`} />
          {open ? <span>-</span> : <span>+</span>}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {data.map((value, index) => (
            <ListItem key={index}>
              <ListItemButton>
                <ListItemText id={`${index}`} primary={`${value}`} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
};

export const PDFPage = () => {
  const [filePDF, setFilePDF] = useState<File>();
  const [fileExcel, setFileExcel] = useState<File>();
  const [activeStep, setActiveStep] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");
  const [items, setItems] = useState<ItemText[]>([]);
  const [itemsSelected, setItemsSelected] = useState<ItemText[]>([]);
  const [itemData, setItemData] = useState<ItemData>();
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
    const updatedItems: ItemText[] = items.map((item) => {
      if (selectedItems[item.id!]) {
        return {
          ...item,
          field: textFieldValues[item.id!] || "",
        };
      }
      return item;
    });
    setItemsSelected(updatedItems);
    handleNext();
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onFileInputChangeExcel = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (target.files && target.files.length == 0) return;
    setFileExcel(target.files?.[0]);
  };

  const onFileInputChangePDF = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (target.files && target.files.length == 0) return;
    setFilePDF(target.files?.[0]);
  };

  const getContentPage = async (doc: PDFDocumentProxy, index: number) => {
    const page = await doc.getPage(index);
    const content = await page.getTextContent();
    return content;
  };

  const underlineText = async (pageContent: unknown) => {
    const pdfLibDoc = await PDFDocument.load(await filePDF!.arrayBuffer());
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
        field: "",
      };
      if (item.str != "") {
        setItems((prevItems) => [...prevItems, newItem]);
      }
    });
  };

  const loadExcel = async () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer) {
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0]; // Obtén el nombre de la primera hoja
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as Array<unknown>;

        const [headers, ...dataRows] = jsonData;

        const result: Record<string, unknown[]> = {};
        headers.forEach((header: string, index: number) => {
          result[header] = dataRows.map((row) => row[index]);
        });
        console.log(result);
        setItemData(result);
      }
    };
    reader.readAsArrayBuffer(fileExcel!);
  };

  const loadPDF = async () => {
    const loadingTask = getDocument(URL.createObjectURL(filePDF!));
    const pdfjsDoc = await loadingTask.promise;

    const numPages = pdfjsDoc._pdfInfo.numPages;

    const pageContentPromise: Promise<unknown>[] = [];
    for (let index = 0; index < numPages; index++) {
      pageContentPromise.push(getContentPage(pdfjsDoc, index + 1));
    }
    const pageContent = await Promise.all(pageContentPromise);
    await underlineText(pageContent);
  };
  return (
    <Container>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key={4}>
          <StepLabel>Cargar archivo de datos</StepLabel>
          <StepContent>
            <Box>
              <input
                type="file"
                className="m-2"
                onChange={onFileInputChangeExcel}
                accept=".xlsx"
              />
              <Button variant="contained" color="error" onClick={loadExcel}>
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
        <Step key={5}>
          <StepLabel>Selección de dato</StepLabel>
          <StepContent>
            <Box>
              <List>
                {itemData != null ? (
                  Object.entries(itemData!).map(([key, values]) => (
                    <CustomListItem key={key} keyProps={key} data={values} />
                  ))
                ) : (
                  <></>
                )}
              </List>
            </Box>
            <Box>
              <Button variant="contained" onClick={handleNext}>
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
        {/* Primer paso carga de archivo */}
        <Step key={1}>
          <StepLabel>Cargar archivo</StepLabel>
          <StepContent>
            <Box>
              <input
                type="file"
                className="m-2"
                onChange={onFileInputChangePDF}
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
        {/* Segundo paso vista de textos encontrados */}
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
        {/* Tercer paso seleccion de textos a sustituir */}
        <Step key={3}>
          <StepLabel>Selección de textos para sustituir</StepLabel>
          <StepContent>
            <Box>
              <List>
                {items.map((item) => {
                  const labelId = `checkbox-list-label-${item.id}`;
                  return (
                    <ListItem key={item.id} role={undefined}>
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
              <Button variant="contained" onClick={handleAccept}>
                Siguiente
              </Button>
              <Button variant="contained" onClick={handleBack}>
                Atras
              </Button>
            </Box>
          </StepContent>
        </Step>
        {/* Primer paso carga de archivo de datos*/}
      </Stepper>
    </Container>
  );
};
