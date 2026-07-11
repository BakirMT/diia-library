import * as XLSX from "xlsx";

export function exportToExcel(dataToExport: any[], fileName: string, sheetName: string) {
  try {
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Create Blob
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    // Detect iframe
    const isIframe = window !== window.parent;
    if (isIframe) {
      alert("Downloads may be blocked in this preview window. If the download does not start, please click the 'Open in New Tab' button at the top right of the preview and try again.");
    }

    // Create download link
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (err) {
    console.error("Export error:", err);
    return false;
  }
}

export function exportToCSV(dataToExport: any[], fileName: string) {
  try {
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    
    // Create Blob
    const data = new Blob([csvOutput], { type: 'text/csv;charset=UTF-8' });
    
    // Detect iframe
    const isIframe = window !== window.parent;
    if (isIframe) {
      alert("Downloads may be blocked in this preview window. If the download does not start, please click the 'Open in New Tab' button at the top right of the preview and try again.");
    }

    // Create download link
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (err) {
    console.error("Export error:", err);
    return false;
  }
}
