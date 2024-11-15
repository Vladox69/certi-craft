import { ChangeEvent, FC, useState } from "react";
import "./PDFPage.css";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Container,
  FormControl,
  FormHelperText,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
  SelectChangeEvent,
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
  page: number;
}

interface ItemData {
  id?: string;
  field: string;
  data: string[];
  isSelect: boolean;
}

interface ItemMatch {
  id?: string;
  itemData: ItemData;
  itemText: ItemText;
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

interface CustomListMatchProps {
  itemsData: ItemData[];
  itemMatch: ItemMatch;
}

type TableRow = ItemText | string;

type Table = TableRow[][];

const CustomListMatch: FC<CustomListMatchProps> = ({
  itemsData,
  itemMatch,
}) => {
  const labelId = `checkbox-list-label-${itemMatch.id}`;
  const initItemData: ItemData = {
    data: [],
    field: "",
    isSelect: true,
    id: "",
  };
  const [selectedItemData, setSelectedItemData] =
    useState<ItemData>(initItemData);

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const id = event.target.value;
    const itemDataFind = itemsData.find((item) => item.id == id);
    if (itemDataFind != undefined) {
      setSelectedItemData(itemDataFind);
      itemMatch.itemData = itemDataFind;
    } else {
      setSelectedItemData(initItemData);
      itemMatch.itemData = initItemData;
    }
  };

  const validateMatch = () => {
    return selectedItemData.id == "";
  };

  return (
    <ListItem key={labelId} role={undefined}>
      <ListItemText
        id={labelId}
        primary={`${itemMatch.itemText.field}`}
        className="me-4"
      />
      <FormControl fullWidth error={validateMatch()}>
        {/* <InputLabel id="demo-simple-select-label">Campo de datos</InputLabel> */}
        <Select
          variant="outlined"
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          label="Campo de datos"
          value={selectedItemData.id}
          onChange={handleSelectChange}
          displayEmpty
        >
          <MenuItem value={""}>Seleccione una opción</MenuItem>
          {itemsData.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.field}
            </MenuItem>
          ))}
        </Select>
        {validateMatch() && (
          <FormHelperText>
            Se debe emparejar con un campo de datos
          </FormHelperText>
        )}
      </FormControl>
    </ListItem>
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
  const [itemsMatch, setItemsMatch] = useState<ItemMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const MySwal = withReactContent(Swal)

  const changeDataFromPDF = async () => {
    const table = buildTable();
    const headers = table[0];
    let pdfLibDoc;
    let page;
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      pdfLibDoc = await PDFDocument.load(await filePDF!.arrayBuffer());
      for (let j = 0; j < headers.length; j++) {
        const itemText: ItemText = headers[j] as ItemText;
        page = pdfLibDoc.getPage(itemText.page);
        page!.drawRectangle({
          x: itemText.x,
          y: itemText.y - 5,
          width: itemText.width,
          height: itemText.height,
          color: rgb(1, 1, 1),
        });
        page!.drawText(row[j].toString(), {
          x: itemText.x,
          y: itemText.y,
          size: itemText.font.size,
          // font:await pdfLibDoc.embedFont(itemText.font.name),
          color: rgb(0, 0, 0),
        });
      }
      const pdfBytes = await pdfLibDoc!.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
    }
  };

  const buildTable = () => {
    const headers = itemsMatch.map((item) => item.itemText);
    const numRows = Math.max(
      ...itemsMatch.map((item) => item.itemData.data.length)
    );
    const table: Table = [headers];
    for (let i = 0; i < numRows; i++) {
      const row = itemsMatch.map((item) => item.itemData.data[i] || "");
      table.push(row);
    }
    return table;
  };

  const handleAcceptData = () => {
    let updateItems: ItemData[] = [];
    itemData.map((item) => {
      if (item.isSelect) {
        updateItems = [...updateItems, item];
      }
    });
    setItemDataSelected(updateItems);
    itemsTextSelected.map((item) => {
      const newItemMatch: ItemMatch = {
        id: uuidv4(),
        itemText: item,
        itemData: {
          data: [],
          field: "",
          isSelect: true,
          id: uuidv4(),
        },
      };
      setItemsMatch((prevItems) => [...prevItems, newItemMatch]);
    });
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

  // const handleBack = () => {
  //   setActiveStep((prevActiveStep) => prevActiveStep - 1);
  // };

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
      const pdfLibPage = pdfLibDoc!.getPage(index);
      buildText(page, index);
      page.items.map((item) => {
        const { width, height, transform } = item as TextItem;
        const x = transform[4];
        const y = transform[5];
        pdfLibPage.drawRectangle({
          x: x,
          y: y - 5,
          width: width,
          height: height,
          color: rgb(1, 1, 0),
          opacity: 0.3,
        });
      });
    });
    const pdfBytes = await pdfLibDoc!.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  const buildText = (page: TextContent, pageNumber: number) => {
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
        page: pageNumber,
      };
      if (itemText.str != "") {
        setItemsText((prevItems) => [...prevItems, newItem]);
      }
    });
  };

  const loadExcel = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
    handleNext();
  };

  const loadPDF = async () => {
    setIsLoading(true);
    const loadingTask = getDocument(URL.createObjectURL(filePDF!));
    const pdfjsDoc = await loadingTask.promise;

    const numPages = pdfjsDoc._pdfInfo.numPages;

    const pageContentPromise: Promise<TextContent>[] = [];
    for (let index = 0; index < numPages; index++) {
      pageContentPromise.push(getContentPage(pdfjsDoc, index + 1));
    }
    const pageContent = await Promise.all(pageContentPromise);
    await underlineText(pageContent);
    setIsLoading(false);
    handleNext();
  };

  const validateTextItem = (item: ItemText) => {
    return !!item.isSelect && item.field === "";
  };

  const validateTextItemSelected = () => {
    const hasSelectedItems = itemsText.some((item) => item.isSelect);
    const hasErrors = itemsText.some((item) => validateTextItem(item));
    return hasErrors || !hasSelectedItems;
  };

  const validateDataItemSelected = () => {
    const hasSelectedData = itemData.some((item) => item.isSelect);
    return !hasSelectedData;
  };

  const openModal=()=>{
    MySwal.fire("Error","Debe emparejar los campos de texto con los campos de datos","error")
  }

  const validateMatchItem = () => {
    const hasMatchItem = itemsMatch.some((item) => item.itemData.id === "");
    if (!hasMatchItem) {
      changeDataFromPDF();
    } else {
      openModal()
    }
  };

  return (
    <Container>
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Primer paso carga de archivo */}
        <Step key={1}>
          <StepLabel>Cargar archivo</StepLabel>
          <StepContent>
            {isLoading ? (
              <CircularProgress size="3rem" />
            ) : (
              <Box>
                <input
                  type="file"
                  className="m-2"
                  onChange={onFileInputChangePDF}
                  accept=".pdf"
                />
              </Box>
            )}
            <Box>
              <Button
                variant="contained"
                onClick={loadPDF}
                disabled={filePDF == null}
              >
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
                          error={validateTextItem(item)}
                          helperText={
                            validateTextItem(item)
                              ? "Debe llenar el campo seleccionado"
                              : ""
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
            <Box>
              <Button
                variant="contained"
                onClick={handleAcceptText}
                disabled={validateTextItemSelected()}
              >
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
        {/* Primer paso carga de archivo de datos*/}
        <Step key={4}>
          <StepLabel>Cargar archivo de datos</StepLabel>
          <StepContent>
            {isLoading ? (
              <CircularProgress size="3rem" />
            ) : (
              <Box>
                <input
                  type="file"
                  className="m-2"
                  onChange={onFileInputChangeExcel}
                  accept=".xlsx"
                />
              </Box>
            )}
            <Box>
              <Button
                variant="contained"
                onClick={loadExcel}
                disabled={fileExcel == null}
              >
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
              <Button
                variant="contained"
                onClick={handleAcceptData}
                disabled={validateDataItemSelected()}
              >
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
                {itemsMatch.map((item) => (
                  <CustomListMatch
                    key={item.id}
                    itemMatch={item}
                    itemsData={itemDataSelected}
                  />
                ))}
              </List>
            </Box>
            <Box>
              <Button variant="contained" onClick={validateMatchItem}>
                Siguiente
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
 
    </Container>
  );
};
