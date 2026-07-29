import React from 'react';

// Placeholder for Modal system
export function ModalHost() {
  return <div id="modal-host" className="relative z-50"></div>;
}

// Placeholder for Toast system
export function ToastHost() {
  return <div id="toast-host" className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center pointer-events-none"></div>;
}

// Placeholder for Dialog system
export function GlobalDialogHost() {
  return <div id="dialog-host" className="relative z-50"></div>;
}
