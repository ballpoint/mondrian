export default {
  download(name, content, contentType) {
    let element = document.createElement('a');
    let href;
    let shouldRevoke = false;

    if (_.isString(content)) {
      href = `data:${contentType};charset=utf-8;base64,${btoa(content)}`;
    } else {
      // Byte array
      let blob = new Blob([content], { type: 'octet/stream' });
      href = window.URL.createObjectURL(blob);
      shouldRevoke = true;
    }

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
