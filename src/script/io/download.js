export default {
  download(name, content, contentType) {
    let element = document.createElement('a');
    let href;
    let shouldRevoke = false;

    // Byte array
    let blob = new Blob([content], { type: contentType });
    href = window.URL.createObjectURL(blob);
    shouldRevoke = true;

    element.setAttribute('href', href);
    element.setAttribute('download', name);

    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (shouldRevoke) {
      window.URL.revokeObjectURL(href);
    }
  }
};