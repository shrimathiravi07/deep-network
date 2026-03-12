import cv2
import torch
from torch.utils.data import Dataset
import os

class WaterDataset(Dataset):

    def __init__(self,img_dir,mask_dir):

        self.img_dir = img_dir
        self.mask_dir = mask_dir
        self.images = os.listdir(img_dir)

    def __len__(self):
        return len(self.images)

    def __getitem__(self,idx):

        img_path = os.path.join(self.img_dir,self.images[idx])
        mask_path = os.path.join(self.mask_dir,self.images[idx])

        image = cv2.imread(img_path)
        image = cv2.resize(image,(512,512))/255.0

        mask = cv2.imread(mask_path,0)
        mask = cv2.resize(mask,(512,512))

        image = torch.tensor(image).permute(2,0,1).float()
        mask = torch.tensor(mask).long()

        return image,mask
