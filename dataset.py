import cv2
import torch
from torch.utils.data import Dataset
import os
import numpy as np

class WaterDataset(Dataset):

    def __init__(self,img_dir,mask_dir):

        self.img_dir = img_dir
        self.mask_dir = mask_dir
        self.images = os.listdir(img_dir)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_name = self.images[idx]
        img_path = os.path.join(self.img_dir, img_name)
        
        # Robust mask path matching
        mask_name = img_name.replace("_sat.jpg", "_mask.png")
        mask_path = os.path.join(self.mask_dir, mask_name)

        image = cv2.imread(img_path)
        if image is None:
            # Fallback or alternative extension
            image = np.zeros((512, 512, 3), dtype=np.uint8)
        else:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image = cv2.resize(image, (512, 512))

        mask = cv2.imread(mask_path, 0)
        if mask is None:
            mask = np.zeros((512, 512), dtype=np.uint8)
        else:
            mask = cv2.resize(mask, (512, 512), interpolation=cv2.INTER_NEAREST)

        image = torch.tensor(image).permute(2,0,1).float() / 255.0
        mask = torch.tensor(mask).long()
        mask = (mask > 0).long() # Ensure binary

        return image, mask
