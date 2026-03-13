# 1. Setup & Imports
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset, random_split
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torchvision import transforms
from PIL import Image
import numpy as np
import os
import matplotlib.pyplot as plt
from google.colab import drive

# Mount Drive
drive.mount('/content/drive')

# ── Config ─────────────────────────────────────────────────────────────────
IMG_DIR    = "/content/drive/MyDrive/training_data/images"
MASK_DIR   = "/content/drive/MyDrive/training_data/masks"
SAVE_DIR   = "/content/drive/MyDrive/models"
BATCH_SIZE = 8
EPOCHS     = 10
LR         = 1e-3
VAL_SPLIT  = 0.2
IMG_SIZE   = (256, 256)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# ── Robust Dataset ──────────────────────────────────────────────────────────
class WaterDataset(Dataset):
    def __init__(self, img_dir, mask_dir, img_size=IMG_SIZE):
        self.img_dir  = img_dir
        self.mask_dir = mask_dir
        self.img_size = img_size

        # Get all image files
        all_images = sorted([f for f in os.listdir(img_dir) if f.lower().endswith('.jpg')])

        self.images = []
        self.masks = []

        print("Matching images with masks...")
        for f in all_images:
            # Logic: '12345_sat.jpg' -> '12345_mask.png'
            mask_name = f.replace("_sat.jpg", "_mask.png")
            img_path = os.path.join(img_dir, f)
            mask_path = os.path.join(mask_dir, mask_name)

            if os.path.exists(mask_path):
                self.images.append(img_path)
                self.masks.append(mask_path)

        print(f"Successfully matched {len(self.images)} pairs.")

        self.img_transform = transforms.Compose([
            transforms.Resize(img_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img  = Image.open(self.images[idx]).convert("RGB")
        mask = Image.open(self.masks[idx]).convert("L")

        img  = self.img_transform(img)
        mask = mask.resize(self.img_size, Image.NEAREST)
        mask = torch.from_numpy(np.array(mask)).long()

        # Threshold: > 0 is water (1), 0 is background (0)
        mask = (mask > 0).long()
        return img, mask

# ── U-Net Architecture ──────────────────────────────────────────────────────
class DoubleConv(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )
    def forward(self, x): return self.net(x)

class UNet(nn.Module):
    def __init__(self, in_channels=3, num_classes=2, features=[64, 128, 256, 512]):
        super().__init__()
        self.downs, self.ups = nn.ModuleList(), nn.ModuleList()
        self.pool = nn.MaxPool2d(2, 2)
        ch = in_channels
        for f in features:
            self.downs.append(DoubleConv(ch, f))
            ch = f
        self.bottleneck = DoubleConv(features[-1], features[-1] * 2)
        for f in reversed(features):
            self.ups.append(nn.ConvTranspose2d(f * 2, f, kernel_size=2, stride=2))
            self.ups.append(DoubleConv(f * 2, f))
        self.final_conv = nn.Conv2d(features[0], num_classes, kernel_size=1)

    def forward(self, x):
        skips = []
        for down in self.downs:
            x = down(x)
            skips.append(x)
            x = self.pool(x)
        x = self.bottleneck(x)
        skips.reverse()
        for i in range(0, len(self.ups), 2):
            x = self.ups[i](x)
            skip = skips[i // 2]
            if x.shape != skip.shape:
                x = torch.nn.functional.interpolate(x, size=skip.shape[2:])
            x = torch.cat([skip, x], dim=1)
            x = self.ups[i+1](x)
        return self.final_conv(x)

# ── Loss & Metrics ──────────────────────────────────────────────────────────
class CombinedLoss(nn.Module):
    def __init__(self):
        super().__init__()
        self.ce = nn.CrossEntropyLoss()
    def forward(self, logits, targets):
        # Using CrossEntropy as base; simplified for stability
        return self.ce(logits, targets)

def iou_score(logits, targets):
    preds = logits.argmax(dim=1)
    inter = ((preds == 1) & (targets == 1)).sum().float()
    union = ((preds == 1) | (targets == 1)).sum().float()
    return (inter / (union + 1e-6)).item()

# ── Execution ───────────────────────────────────────────────────────────────
full_ds = WaterDataset(IMG_DIR, MASK_DIR)
val_size = int(len(full_ds) * VAL_SPLIT)
train_ds, val_ds = random_split(full_ds, [len(full_ds) - val_size, val_size])

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
val_loader   = DataLoader(val_ds,  batch_size=BATCH_SIZE, shuffle=False)

model = UNet().to(device)
optimizer = optim.Adam(model.parameters(), lr=LR)
scheduler = ReduceLROnPlateau(optimizer, mode="min", patience=2, factor=0.5)
loss_fn = CombinedLoss()

os.makedirs(SAVE_DIR, exist_ok=True)
best_val_loss = float("inf")

print("\nStarting Training...")
for epoch in range(1, EPOCHS + 1):
    # Train
    model.train()
    train_loss, train_iou = 0, 0
    for img, mask in train_loader:
        img, mask = img.to(device), mask.to(device)
        optimizer.zero_grad()
        out = model(img)
        loss = loss_fn(out, mask)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()
        train_iou += iou_score(out, mask)

    # Val
    model.eval()
    val_loss, val_iou = 0, 0
    with torch.no_grad():
        for img, mask in val_loader:
            img, mask = img.to(device), mask.to(device)
            out = model(img)
            loss = loss_fn(out, mask)
            val_loss += loss.item()
            val_iou += iou_score(out, mask)

    t_loss, v_loss = train_loss/len(train_loader), val_loss/len(val_loader)
    scheduler.step(v_loss)

    status = " ★ Saved" if v_loss < best_val_loss else ""
    if v_loss < best_val_loss:
        best_val_loss = v_loss
        torch.save(model.state_dict(), f"{SAVE_DIR}/best_unet.pth")

    print(f"Epoch {epoch:02d} | Train Loss: {t_loss:.4f} IoU: {train_iou/len(train_loader):.4f} | "
          f"Val Loss: {v_loss:.4f} IoU: {val_iou/len(val_loader):.4f}{status}")

print(f"\nDone! Best Model at {SAVE_DIR}/best_unet.pth")