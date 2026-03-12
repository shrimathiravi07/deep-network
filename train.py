import torch
from torch.utils.data import DataLoader
from dataset import WaterDataset
from model import get_water_guard_model
import torch.nn as nn
import torch.optim as optim
import os

device = "cuda" if torch.cuda.is_available() else "cpu"

dataset = WaterDataset(
    r"d:\Waterbody-Detection-Via-Deep-Lear\Waterbody-Detection-Via-Deep-Learning-main\data\dataset\Water Bodies Dataset\Images",
    r"d:\Waterbody-Detection-Via-Deep-Learning-main\Waterbody-Detection-Via-Deep-Learning-main\data\dataset\Water Bodies Dataset\Masks"
)

loader = DataLoader(dataset,batch_size=4,shuffle=True)

model = get_water_guard_model().to(device)

loss_fn = nn.CrossEntropyLoss()

optimizer = optim.Adam(model.parameters(),lr=0.001)

epochs = 10

for epoch in range(epochs):

    total_loss = 0

    for img,mask in loader:

        img = img.to(device)
        mask = mask.to(device)

        optimizer.zero_grad()

        output = model(img)

        loss = loss_fn(output,mask)

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    print("Epoch:",epoch,"Loss:",total_loss)

os.makedirs("models", exist_ok=True)
torch.save(model.state_dict(),"models/best_model.pth")
