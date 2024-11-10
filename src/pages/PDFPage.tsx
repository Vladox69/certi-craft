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
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
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
  faMinusSquare,
  faPlusSquare,
} from "@fortawesome/free-regular-svg-icons";
import { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
GlobalWorkerOptions.workerSrc =
  "../../node_modules/pdfjs-dist/build/pdf.worker.mjs";
type ExcelRow = Record<string, string>;

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
  isSelect: boolean;
}

interface ItemData {
  id?: string;
  field: string;
  data: string[];
  isSelect: boolean;
}

interface CustomListItemProps {
  itemData: ItemData;
  sendData: (id: string) => void;
}

const CustomListItem: FC<CustomListItemProps> = ({ itemData, sendData }) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  const handleCheckboxChange = () => {
    sendData(itemData.id!);
  };

  return (
    <>
      <ListItem>
        <ListItemButton>
          <ListItemIcon>
            <Checkbox
              edge="start"
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": itemData.id }}
              onChange={handleCheckboxChange}
            />
          </ListItemIcon>
          <ListItemText id={itemData.id} primary={`${itemData.field}`} />
          {!open ? (
            <FontAwesomeIcon icon={faPlusSquare} onClick={handleClick} />
          ) : (
            <FontAwesomeIcon icon={faMinusSquare} onClick={handleClick} />
          )}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {itemData.data.map((value, index) => (
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
  const [itemsText, setItemsText] = useState<ItemText[]>([]);
  const [itemsTextSelected, setItemsTextSelected] = useState<ItemText[]>([]);
  const [itemData, setItemData] = useState<ItemData[]>([]);
  const [itemDataSelected, setItemDataSelected] = useState<ItemData[]>([]);

  const handleAcceptData = () => {
    let updateItems: ItemData[] = [];
    itemData.map((item) => {
      if (item.isSelect) {
        updateItems = [...updateItems, item];
      }
    });
    setItemDataSelected(updateItems);
    handleNext();
  };

  const handleDataFromCustomComponent = (id: string) => {
    setItemData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, isSelect: !item.isSelect } : item
      )
    );
  };

  const handleCheckboxChange = (id: string) => {
    setItemsText((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, isSelect: !item.isSelect } : item
      )
    );
  };

  const handleTextFieldChange = (id: string, value: string) => {
    setItemsText((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, field: value } : item
      )
    );
  };

  const handleAcceptText = () => {
    let updateItems: ItemText[] = [];
    itemsText.map((item) => {
      if (item.isSelect) {
        updateItems = [...updateItems, item];
      }
    });
    setItemsTextSelected(updateItems);
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

  const getContentPage = async (
    doc: PDFDocumentProxy,
    index: number
  ): Promise<TextContent> => {
    const page = await doc.getPage(index);
    const content = await page.getTextContent();
    return content;
  };

  const underlineText = async (pageContent: TextContent[]) => {
    const pdfLibDoc = await PDFDocument.load(await filePDF!.arrayBuffer());
    pageContent.map((page, index) => {
      const pdfLibPage = pdfLibDoc.getPage(index);
      buildText(page);
      page.items.map((item) => {
        const { width, height, transform } = item as TextItem;
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

  const buildText = (page: TextContent) => {
    const { items, styles } = page;
    items.map((item) => {
      const itemText = item as TextItem;
      const fontProps = styles[itemText.fontName];
      const newItem: ItemText = {
        id: uuidv4(),
        text: itemText.str,
        width: itemText.width,
        height: itemText.height,
        x: itemText.transform[4],
        y: itemText.transform[5],
        font: {
          name: fontProps.fontFamily,
          size: Math.abs(itemText.transform[3]),
        },
        field: "",
        isSelect: false,
      };
      if (itemText.str != "") {
        setItemsText((prevItems) => [...prevItems, newItem]);
      }
    });
  };

  const loadExcel = async () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer) {
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(
          worksheet
        ) as ExcelRow[];
        const groupedData = jsonData.reduce<Record<string, string[]>>(
          (acc, obj) => {
            Object.keys(obj).forEach((key) => {
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(obj[key]);
            });
            return acc;
          },
          {}
        );
        Object.entries(groupedData).map(([value, data]) => {
          const newItemData: ItemData = {
            data,
            field: value,
            isSelect: false,
            id: uuidv4(),
          };
          setItemData((prevData) => [...prevData, newItemData]);
        });
      }
    };
    reader.readAsArrayBuffer(fileExcel!);
  };

  const loadPDF = async () => {
    const loadingTask = getDocument(URL.createObjectURL(filePDF!));
    const pdfjsDoc = await loadingTask.promise;

    const numPages = pdfjsDoc._pdfInfo.numPages;

    const pageContentPromise: Promise<TextContent>[] = [];
    for (let index = 0; index < numPages; index++) {
      pageContentPromise.push(getContentPage(pdfjsDoc, index + 1));
    }
    const pageContent = await Promise.all(pageContentPromise);
    await underlineText(pageContent);
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
                {itemsText.map((item) => {
                  const labelId = `checkbox-list-label-${item.id}`;
                  return (
                    <ListItem key={item.id} role={undefined}>
                      <ListItemButton>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={!!item.isSelect}
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
                          value={item.field || ""}
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
              <Button variant="contained" onClick={handleAcceptText}>
                Siguiente
              </Button>
              <Button variant="contained" onClick={handleBack}>
                Atras
              </Button>
            </Box>
          </StepContent>
        </Step>
        {/* Primer paso carga de archivo de datos*/}
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
                {itemData.map((item) => (
                  <CustomListItem
                    key={item.id}
                    itemData={item}
                    sendData={handleDataFromCustomComponent}
                  />
                ))}
              </List>
            </Box>
            <Box>
              <Button variant="contained" onClick={handleAcceptData}>
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step key={6}>
          <StepLabel>Emparejamiento de campos</StepLabel>
          <StepContent>
            <Box>
              <List
                subheader={
                  <ListSubheader component="div" id="nested-list-subheader">
                    Campos a cambiar
                  </ListSubheader>
                }
              >
                {itemsTextSelected.map((item) => {
                  const labelId = `checkbox-list-label-${item.id}`;
                  return (
                    <ListItem key={item.id} role={undefined}>
                      <ListItemText id={labelId} primary={`${item.text}`} />
                      <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">
                          Campo de datos
                        </InputLabel>
                        <Select
                          labelId="demo-simple-select-label"
                          id="demo-simple-select"
                          label="Campo de datos"
                        >
                          {itemDataSelected.map((item) => (
                            <MenuItem value={item.id}>{item.field}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
            <Box>
              <Button variant="contained" onClick={handleNext}>
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </Container>
  );
};
