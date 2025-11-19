import { _decorator, Component, Node, Prefab, Sprite, Button, instantiate, Vec3, Color, EditBox } from 'cc';
const { ccclass, property } = _decorator;

@ccclass("Main")
export class Main extends Component {
  @property({ type: Node })
  gridParent: Node = null; // родительский объект для иконок

  @property({ type: Prefab })
  iconPrefab: Prefab = null; // префаб иконки

  @property({ type: Prefab })
  iconPrefab2: Prefab = null; // префаб-2

  @property({ type: EditBox })
  inputM: EditBox = null; // поле ввода для M, ширина

  @property({ type: EditBox })
  inputN: EditBox = null; // поле ввода для N, высота

  @property({ type: EditBox })
  inputX: EditBox = null; // поле ввода для X, количество типов иконок

  @property({ type: EditBox })
  inputY: EditBox = null; // поле ввода для Y, минимальный размер кластера

  private M: number = 7;
  private N: number = 8;
  private X: number = 5;
  private Y: number = 3;

  private grid: Node[][] = []; // сетка иконок

  start() {
    // установки событий и вызова других методов при старте компонент
    this.initGrid();
  }

  initGrid() {
    // отвечает за создание структуры данных
    for (let i = 0; i < this.M; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.N; j++) {
        this.grid[i][j] = null;
      }
    }
  }

  onStartButtonClick() {
    // нажатие кнопки "старт"
    this.updateParameters(); // обновление параметров из полей ввода
    this.generateGrid();
    this.highlightClusters();
  }

  updateParameters() {
        this.M = parseInt(this.inputM.string) || this.M;
        this.N = parseInt(this.inputN.string) || this.N;
        this.X = parseInt(this.inputX.string) || this.X;
        this.Y = parseInt(this.inputY.string) || this.Y;
        
        // Обновляем сетку с новыми параметрами
        this.initGrid();
  }

  generateGrid() {
    // заполнение поля новыми иконками
    const startX = -260; // начальная координата по X
    const startY = 270; // начальная координата по Y
    const spacingX = 65; // расстояние между иконками по X
    const spacingY = 65; // расстояние между иконками по Y

    for (let i = 0; i < this.M; i++) {
      for (let j = 0; j < this.N; j++) {
        const iconNode = instantiate(this.iconPrefab);
        iconNode.setPosition(
          new Vec3(startX + i * spacingX, startY - j * spacingY, 0)
        ); // установка позиции с учетом начальных координат и расстояния
        const iconComponent = iconNode.getComponent(Sprite); // получает компонент Sprite из созданного узла иконки
        const iconType = Math.floor(Math.random() * this.X); // для определения типа иконки
        iconComponent.color = this.getColorForType(iconType); // устанавливает цвет компонента
        this.grid[i][j] = iconNode; // сохраняет ссылку на созданный узел иконки в двумерном массиве
        this.gridParent.addChild(iconNode); // делает иконку видимой на экране
      }
    }
  }

  highlightClusters() {
    // для поиска и выделения кластеров элементов в двумерной сетке
    const visited: boolean[][] = Array.from({ length: this.M }, () =>
      Array(this.N).fill(false)
    );

    for (let i = 0; i < this.M; i++) {
      for (let j = 0; j < this.N; j++) {
        if (!visited[i][j]) {
          const cluster: Vec3[] = [];
          const iconType = this.grid[i][j].getComponent(Sprite).color;
          this.findCluster(i, j, iconType, visited, cluster);

          if (cluster.length >= this.Y) {
            cluster.forEach((pos) => {
              const iconNode = this.grid[pos.x][pos.y];
              this.highlightIcon(iconNode);
            });
          }
        }
      }
    }
  }

  findCluster(
    x: number,
    y: number,
    iconType: any,
    visited: boolean[][],
    cluster: Vec3[]
  ) {
    // используется для поиска и формирования кластера элементов в двумерной сетке
    if (
      x < 0 ||
      x >= this.M ||
      y < 0 ||
      y >= this.N || // если x или y выходят за пределы границ сетки
      visited[x][y] || //  если текущая ячейка уже была посещена
      !this.isSameType(this.grid[x][y].getComponent(Sprite).color, iconType) // если цвет текущего элемента не совпадает с искомым типом
    ) {
      return;
    }

    visited[x][y] = true;
    cluster.push(new Vec3(x, y, 0));

    // Проверка соседей
    this.findCluster(x - 1, y, iconType, visited, cluster); // вверх
    this.findCluster(x + 1, y, iconType, visited, cluster); // вниз
    this.findCluster(x, y - 1, iconType, visited, cluster); // влево
    this.findCluster(x, y + 1, iconType, visited, cluster); // вправо
  }

  isSameType(color1: any, color2: any): boolean {
    // указывает, являются ли эти два цвета одинаковыми
    return color1.equals(color2);
  }

  highlightIcon(iconNode: Node) {
    const parent = iconNode.parent; // получаем родительский узел, чтобы затем добавить новый префаб
    const newIcon = instantiate(this.iconPrefab2); // создаем новый экземпляр префаба
    newIcon.position = iconNode.position; // устанавливаем позицию нового узла в ту же позицию, что и у старого
    iconNode.destroy(); // удаляем старую иконку
    parent.addChild(newIcon); // добавляем новый узел в родительский узел
  }

  getColorForType(type: number): Color {
    // предназначен для получения цвета в зависимости от переданного типа
    switch (type) {
      case 0:
        return new Color(255, 255, 0); // Желтый
      case 1:
        return new Color(0, 255, 0); // Зеленый
      case 2:
        return new Color(0, 0, 255); // Синий
      case 3:
        return new Color(255, 165, 0); // Оранжевый
      case 4:
        return new Color(255, 0, 0); // Красный
    }
  }
}