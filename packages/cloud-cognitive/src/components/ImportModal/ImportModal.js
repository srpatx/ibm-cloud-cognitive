import React, { useState } from 'react';
import {
  Modal,
  FileUploaderDropContainer,
  FileUploaderItem,
  TextInput,
  Button,
} from 'carbon-components-react';
import PropTypes from 'prop-types';
import uuidv4 from '../../global/js/utils/uuidv4';
import { pkg } from '../../settings';
const componentName = 'ImportModal';

export let ImportModal = ({
  defaultErrorBody,
  defaultErrorHeader,
  fetchErrorBody,
  fetchErrorHeader,
  fileDropHeader,
  fileDropLabel,
  fileUploadLabel,
  inputButtonText,
  inputHeader,
  inputId,
  inputPlaceholder,
  invalidFileTypeErrorBody,
  invalidFileTypeErrorHeader,
  maxFileSize,
  maxFileSizeErrorBody,
  maxFileSizeErrorHeader,
  modalBody,
  modalHeading,
  multiple,
  onRequestClose,
  onRequestSubmit,
  open,
  primaryButtonText,
  secondaryButtonText,
  validFileTypes,
}) => {
  const [files, setFiles] = useState([]);
  const [importUrl, setImportUrl] = useState('');

  const isInvalidFileType = (file) => {
    const acceptedTypes = new Set(validFileTypes);
    const { name, type: mimeType = '' } = file;
    const extension = name.split('.').pop();
    if (acceptedTypes.has(mimeType) || acceptedTypes.has(extension))
      return false;
    return true;
  };

  const updateFiles = (newFiles) => {
    const updatedFiles = newFiles.map((file) => {
      const newFile = {
        uuid: file.uuid || uuidv4(),
        status: 'edit',
        iconDescription: 'Delete file',
        name: file.name,
        filesize: file.size,
        invalidFileType: file.invalidFileType,
        fileData: file,
        fetchError: file.fetchError,
      };
      if (newFile.fetchError) {
        newFile.errorBody = fetchErrorBody || defaultErrorBody;
        newFile.errorSubject = fetchErrorHeader || defaultErrorHeader;
        newFile.invalid = true;
      } else if (newFile.invalidFileType) {
        newFile.errorBody = invalidFileTypeErrorBody || defaultErrorBody;
        newFile.errorSubject = invalidFileTypeErrorHeader || defaultErrorHeader;
        newFile.invalid = true;
      } else if (maxFileSize && newFile.filesize > maxFileSize) {
        newFile.errorBody = maxFileSizeErrorBody || defaultErrorBody;
        newFile.errorSubject = maxFileSizeErrorHeader || defaultErrorHeader;
        newFile.invalid = true;
      }
      return newFile;
    });
    const finalFiles = [...updatedFiles];
    setFiles(finalFiles);
  };

  const fetchFile = async (evt) => {
    evt.preventDefault();
    const fileName = importUrl
      .substring(importUrl.lastIndexOf('/') + 1)
      .split('?')[0];
    const pendingFile = {
      name: fileName,
      status: 'uploading',
      uuid: uuidv4(),
    };
    setFiles([pendingFile]);
    try {
      const response = await fetch(importUrl);
      if (!response.ok || response.status !== 200)
        throw new Error(response.status);
      const blob = await response.blob();
      const fetchedFile = new File([blob], fileName, { type: blob.type });
      fetchedFile.invalidFileType = isInvalidFileType(fetchedFile);
      fetchedFile.uuid = pendingFile.uuid;
      updateFiles([fetchedFile]);
    } catch (err) {
      const failedFile = {
        ...pendingFile,
        fetchError: true,
      };
      updateFiles([failedFile]);
    }
  };

  const onAddFile = (evt, { addedFiles }) => {
    evt.stopPropagation();
    updateFiles(addedFiles);
  };

  const onRemoveFile = (uuid) => {
    const updatedFiles = files.filter((f) => f.uuid !== uuid);
    setFiles(updatedFiles);
  };

  const onSubmitHandler = () => {
    onRequestSubmit(files);
  };

  const inputHandler = (evt) => {
    setImportUrl(evt.target.value);
  };

  const numberOfFiles = files.length;
  const numberOfInvalidFiles = files.filter((f) => f.isInvalidFileType).length;
  const hasFiles = !!numberOfFiles;
  const primaryButtonDisabled = !hasFiles || files.some((f) => f.invalid);
  const importButtonDisabled = !importUrl;
  const invalidValidLabel = `${numberOfInvalidFiles} / ${numberOfFiles}`;
  const blockClass = `${pkg.prefix}--import-modal`;

  return (
    <Modal
      open={open}
      primaryButtonText={primaryButtonText}
      secondaryButtonText={secondaryButtonText}
      modalHeading={modalHeading}
      primaryButtonDisabled={primaryButtonDisabled}
      onRequestSubmit={onSubmitHandler}
      onRequestClose={onRequestClose}
      className={blockClass}
      size="sm">
      <p className={`${blockClass}__body`}>{modalBody}</p>
      <p className={`${blockClass}__label`}>{fileDropHeader}</p>
      <FileUploaderDropContainer
        accept={validFileTypes}
        labelText={fileDropLabel}
        onAddFiles={onAddFile}
        disabled={!!files.length}
        multiple={multiple}
      />
      <p className={`${blockClass}__label`}>{inputHeader}</p>
      <div className={`${blockClass}__input-group`}>
        <TextInput
          labelText=""
          id={inputId}
          onChange={inputHandler}
          placeholder={inputPlaceholder}
          value={importUrl}
          disabled={hasFiles}
        />
        <Button
          onClick={fetchFile}
          className={`${blockClass}__import-button`}
          size="sm"
          disabled={importButtonDisabled}>
          {inputButtonText}
        </Button>
      </div>
      <div className="bx--file-container" style={{ width: '100%' }}>
        {hasFiles && (
          <p className={`${blockClass}__helper-text`}>
            {`${invalidValidLabel} ${fileUploadLabel}`}
          </p>
        )}
        {files.map((file) => (
          <FileUploaderItem
            key={file.uuid}
            onDelete={() => onRemoveFile(file.uuid)}
            name={file.name}
            status={file.status}
            size="default"
            uuid={file.uuid}
            iconDescription={file.iconDescription}
            invalid={file.invalid}
            errorBody={file.errorBody}
            errorSubject={file.errorSubject}
            filesize={file.filesize}
          />
        ))}
      </div>
    </Modal>
  );
};

// Return a placeholder if not released and not enabled by feature flag
ImportModal = pkg.checkComponentEnabled(ImportModal, componentName);

ImportModal.propTypes = {
  /**
   * The default message shown for an import error
   */
  defaultErrorBody: PropTypes.string,
  /**
   * The default header that is displayed to show an error message
   */
  defaultErrorHeader: PropTypes.string,
  /**
   * Optional error body to display specifically for a fetch error
   */
  fetchErrorBody: PropTypes.string,
  /**
   * Optional error header to display specifically for a fetch error
   */
  fetchErrorHeader: PropTypes.string,
  /**
   * Header for the drag and drop box
   */
  fileDropHeader: PropTypes.string,
  /**
   * Label for the drag and drop box
   */
  fileDropLabel: PropTypes.string,
  /**
   * Label that appears when a file is uploaded to show number of files (1 / 1)
   */
  fileUploadLabel: PropTypes.string,
  /**
   * Button text for import by url button
   */
  inputButtonText: PropTypes.string,
  /**
   * Header to display above import by url
   */
  inputHeader: PropTypes.string,
  /**
   * ID for text input
   */
  inputId: PropTypes.string,
  /**
   * Placeholder for text input
   */
  inputPlaceholder: PropTypes.string,
  /**
   * Optional error message to display specifically for a invalid file type error
   */
  invalidFileTypeErrorBody: PropTypes.string,
  /**
   * Optional error header to display specifically for a invalid file type error
   */
  invalidFileTypeErrorHeader: PropTypes.string,
  /**
   * File size limit in bytes
   */
  maxFileSize: PropTypes.number,
  /**
   * Optional error message to display specifically for a max file size error
   */
  maxFileSizeErrorBody: PropTypes.string,
  /**
   * Optional error header to display specifically for a max file size error
   */
  maxFileSizeErrorHeader: PropTypes.string,
  /**
   * Content that is displayed inside the modal
   */
  modalBody: PropTypes.string,
  /**
   * Header that displays at the top of the modal
   */
  modalHeading: PropTypes.string,
  /**
   * Designates if the file uploader can accept multiple files
   */
  multiple: PropTypes.bool,
  /**
   * Specify a handler for closing modal
   */
  onRequestClose: PropTypes.func,
  /**
   * Specify a handler for "submitting" modal. Access the imported file via `file => {}`
   */
  onRequestSubmit: PropTypes.func,
  /**
   * Specify whether the Modal is currently open
   */
  open: PropTypes.bool,
  /**
   * Specify the text for the primary button
   */
  primaryButtonText: PropTypes.string,
  /**
   * Specify the text for the secondary button
   */
  secondaryButtonText: PropTypes.string,
  /**
   * Specify the types of files that this input should be able to receive
   */
  validFileTypes: PropTypes.array,
};

ImportModal.defaultProps = {
  multiple: false,
  onRequestClose: () => {},
  onRequestSubmit: () => {},
  open: false,
  validFileTypes: [],
};

ImportModal.displayName = componentName;
