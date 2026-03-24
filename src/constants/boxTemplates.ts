import { BoxType } from '../types/box';

export const BOX_TEMPLATES: BoxType[] = [
  {
    id: 'standard-box',
    name: '标准折叠纸盒',
    description: '最常见的六面体包装盒，支持自动折叠演示。',
    dimensions: {
      width: 160,
      height: 240,
      depth: 80,
    },
    box3D: {
      w: 2,
      h: 3,
      d: 1,
    },
    dieLine: {
      width: 1000,
      height: 800,
      faces: [
        {
          type: 'front',
          width3D: 2,
          height3D: 3,
          canvasX: 400,
          canvasY: 300,
          canvasW: 160,
          canvasH: 240,
        },
        {
          type: 'left',
          width3D: 1,
          height3D: 3,
          canvasX: 400 - 80 - 40, // CX - CW/2 - CD/2
          canvasY: 300,
          canvasW: 80,
          canvasH: 240,
        },
        {
          type: 'right',
          width3D: 1,
          height3D: 3,
          canvasX: 400 + 80 + 40, // CX + CW/2 + CD/2
          canvasY: 300,
          canvasW: 80,
          canvasH: 240,
        },
        {
          type: 'back',
          width3D: 2,
          height3D: 3,
          canvasX: 400 + 80 + 80 + 80, // CX + CW/2 + CD + CW/2
          canvasY: 300,
          canvasW: 160,
          canvasH: 240,
        },
        {
          type: 'top',
          width3D: 2,
          height3D: 1,
          canvasX: 400,
          canvasY: 300 - 120 - 40, // CY - CH/2 - CD/2
          canvasW: 160,
          canvasH: 80,
        },
        {
          type: 'bottom',
          width3D: 2,
          height3D: 1,
          canvasX: 400,
          canvasY: 300 + 120 + 40, // CY + CH/2 + CD/2
          canvasW: 160,
          canvasH: 80,
        },
      ],
    },
  },
  {
    id: 'pizza-box',
    name: '披萨翻盖盒',
    description: '扁平设计的翻盖包装，适用于披萨、礼品盒等。',
    dimensions: {
      width: 300,
      height: 300,
      depth: 40,
    },
    box3D: {
      w: 3,
      h: 3,
      d: 0.4,
    },
    dieLine: {
      width: 1200,
      height: 1000,
      faces: [
        {
          type: 'front',
          width3D: 3,
          height3D: 3,
          canvasX: 500,
          canvasY: 400,
          canvasW: 300,
          canvasH: 300,
        },
        {
          type: 'left',
          width3D: 0.4,
          height3D: 3,
          canvasX: 500 - 150 - 20,
          canvasY: 400,
          canvasW: 40,
          canvasH: 300,
        },
        {
          type: 'right',
          width3D: 0.4,
          height3D: 3,
          canvasX: 500 + 150 + 20,
          canvasY: 400,
          canvasW: 40,
          canvasH: 300,
        },
        {
          type: 'back',
          width3D: 3,
          height3D: 3,
          canvasX: 500 + 150 + 40 + 150,
          canvasY: 400,
          canvasW: 300,
          canvasH: 300,
        },
        {
          type: 'top',
          width3D: 3,
          height3D: 0.4,
          canvasX: 500,
          canvasY: 400 - 150 - 20,
          canvasW: 300,
          canvasH: 40,
        },
        {
          type: 'bottom',
          width3D: 3,
          height3D: 0.4,
          canvasX: 500,
          canvasY: 400 + 150 + 20,
          canvasW: 300,
          canvasH: 40,
        },
      ],
    },
  },
];
