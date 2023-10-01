import JSZip from 'jszip';
import { requestUrl } from 'obsidian';

/**
 * Download a zip file from a url and return the bytes of the file as an ArrayBuffer.
 * @param url String url of the zip file to download.
 * @returns ArrayBuffer of the zip file.
 */
export const downloadZipFile = async (url: string): Promise<ArrayBuffer> => {
  const fetched = await requestUrl({ url });
  const bytes = fetched.arrayBuffer;
  return bytes;
};

/**
 * Transforms a JSZip file into a File object.
 * @param file JSZip file to transform.
 * @returns File object of the JSZip file.
 */
export const getFileFromJSZipFile = async (
  file: JSZip.JSZipObject,
): Promise<File> => {
  const fileData = await file.async('blob');
  const filename = file.name.split('/').pop();
  return new File([fileData], filename);
};

/**
 * Read a zip file and return the files inside it.
 * @param bytes ArrayBuffer of the zip file.
 * @param extraPath String path to filter the files inside the zip file. This can be used
 * to set an extra path (like a directory inside the zip file) to filter the files.
 * @returns Array of loaded files inside the zip file.
 */
export const readZipFile = async (
  bytes: ArrayBuffer,
  extraPath = '',
): Promise<JSZip.JSZipObject[]> => {
  const zipper = new JSZip();
  const unzippedFiles = await zipper.loadAsync(bytes);
  return Promise.resolve(unzippedFiles).then((unzipped) => {
    if (!Object.keys(unzipped.files).length) {
      return Promise.reject('No file was found');
    }

    const files: JSZip.JSZipObject[] = [];
    // Regex for retrieving the files inside the zip file or inside the directory of a
    // zip file.
    const regex = new RegExp(extraPath + '(.+)\\.svg', 'g');
    Object.entries(unzippedFiles.files).forEach(
      ([_, v]: [string, JSZip.JSZipObject]) => {
        const matched = v.name.match(regex);
        if (!v.dir && matched && matched.length > 0) {
          files.push(v);
        }
      },
    );

    return files;
  });
};
