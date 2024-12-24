import React from "react";
import Icon from '@mdi/react';
import { mdiCloseThick } from '@mdi/js';

export const ImageModal = ({ type, id, handleModalClose }) => {
  return (
    <div className="image_modal_container" onClick={handleModalClose}>
      <div className="image_modal_window">
        <div className="image_modal_close">
          <div onClick={handleModalClose}>
            <Icon path={mdiCloseThick} size={3} />
          </div>
        </div>
        {
          type === 'message' && (
            <img src={`http://localhost:3000/api/chat/message/image/${id}`} onClick={(e) => e.stopPropagation()} />
          )
        }
        {
          type === 'group' && (
            <img src={`http://localhost:3000/api/group/${id}/thumbnail`} />
          )
        }
      </div>
    </div>
  )
}