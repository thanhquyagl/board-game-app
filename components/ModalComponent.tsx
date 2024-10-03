import React from 'react';
import Modal from '@mui/material/Modal';

type ModalComponentProps = {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  content: React.ReactNode;
  actions?: React.ReactNode;
};

const ModalComponent: React.FC<ModalComponentProps> = ({ isOpen, onClose, title, content, actions }) => {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 border rounded max-w-[calc(100vw-20px)] w-[600px] bg-gray-950 shadow-sm md:max-w-full">
        <p id="modal-title" className="text-2xl font-bold">{title}</p>
        <div id="modal-description" className="my-4">
          {content}
        </div>
        <div>
          {actions}
        </div>
      </div>
    </Modal>
  );
};

export default ModalComponent;
