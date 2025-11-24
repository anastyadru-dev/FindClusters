import { _decorator, Component, Node, Prefab, Sprite, Button, instantiate, Vec3, EditBox, Skeleton, sp} from 'cc';
import { PrefabType } from './PrefabType'; // Импортируем PrefabType
const { ccclass, property } = _decorator;

@ccclass("Main")
export class Main extends Component {
  @property({ type: Node })
  gridParent: Node = null; // родительский объект для иконок

  @property({ type: [Prefab] })
  iconPrefabs: Prefab[] = []; // массив префабов иконок

  @property({ type: Prefab })
  iconPrefab2: Prefab = null; // родительский объект для иконок
  
  @property({ type: EditBox })
  inputM: EditBox = null; // поле ввода для M, ширина

  @property({ type: EditBox })
  inputN: EditBox = null; // поле ввода для N, высота

  @property({ type: EditBox })
  inputX: EditBox = null; // поле ввода для X, количество типов иконок

  @property({ type: EditBox })
  inputY: EditBox = null; // поле ввода для Y, минимальный размер кластера

  @property({ type: Button })
  startButton: Button = null; // ссылка на кнопку Start

  private grid: Node[][] = []; // сетка иконок
  private M: number = 7;
  private N: number = 8;
  private X: number = 5;
  private Y: number = 3;

  start() {
    // установки событий и вызова других методов при старте компонент
    this.initGrid();
  }

  initGrid() {
    // отвечает за создание структуры данных
    this.grid = []; // сбрасываем сетку
    for (let i = 0; i < this.M; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.N; j++) {
        this.grid[i][j] = null;
      }
    }
  }

  clearGrid() {
    // удаляем все дочерние элементы из родительского узла
    while (this.gridParent.children.length > 0) {
      this.gridParent.removeChild(this.gridParent.children[0]);
    }
    // сбрасываем сетку
    this.initGrid();
  }

  onStartButtonClick() {
    this.startButton.interactable = false; // блокируем кнопку start
    this.inputM.enabled = false; // блокируем поле ввода M
    this.inputN.enabled = false; // блокируем поле ввода N
    this.inputX.enabled = false; // блокируем поле ввода X
    this.inputY.enabled = false; // блокируем поле ввода Y

    this.updateParameters(); // обновление параметров из полей ввода

    this.clearGrid(); // очищаем сетку перед генерацией нового поля

    this.generateGrid();
    this.highlightClusters();
  }

  updateParameters() {
    this.M = parseInt(this.inputM.string);
    this.N = parseInt(this.inputN.string);
    this.X = parseInt(this.inputX.string);
    this.Y = parseInt(this.inputY.string);

    // обновляем сетку с новыми параметрами
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
        const iconType = Math.floor(Math.random() * this.iconPrefabs.length); // выбираем случайный тип из массива префабов
        console.log(iconType);

        if (iconType >= 0 && iconType < this.iconPrefabs.length) { // работа с только допустимыми индексами
          const iconNode = instantiate(this.iconPrefabs[iconType]); // создаем иконку из выбранного префаба
          iconNode.setPosition(
            new Vec3(startX + i * spacingX, startY - j * spacingY, 0)
          ); // установка позиции с учетом начальных координат и расстояния
          this.grid[i][j] = iconNode; // сохраняет ссылку на созданный узел иконки в двумерном массиве
          this.gridParent.addChild(iconNode); // делает иконку видимой на экране
        }
      }
    }
  }

  highlightClusters() {
    // для поиска и выделения кластеров элементов в двумерной сетке
    const visited: boolean[][] = Array.from({ length: this.M }, () => Array(this.N).fill(false)
    );

    for (let i = 0; i < this.M; i++) { // прохождение по всем строкам
      for (let j = 0; j < this.N; j++) {
        if (!visited[i][j]) { // проверка на посещение
          const cluster: Vec3[] = []; // используется для хранение массива узлов
          const prefabType = this.grid[i][j].getComponent(PrefabType).type; // определяется тип префаба
          this.findCluster(i, j, prefabType, visited, cluster); // поиск кластера
          if (cluster.length >= this.Y) { // проверка размера кластера
            cluster.forEach((pos) => {
              const iconNode = this.grid[pos.x][pos.y];
              this.highlightIcon(iconNode); // изменение иконки
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
      !this.isSameType(this.grid[x][y].getComponent(PrefabType).type, iconType) // если тип текущего элемента не совпадает с искомым типом
    ) {
      return;
    }

    visited[x][y] = true;
    cluster.push(new Vec3(x, y, 0));

    // проверка соседей
    this.findCluster(x - 1, y, iconType, visited, cluster); // вверх
    this.findCluster(x + 1, y, iconType, visited, cluster); // вниз
    this.findCluster(x, y - 1, iconType, visited, cluster); // влево
    this.findCluster(x, y + 1, iconType, visited, cluster); // вправо
  }

  isSameType(type1: any, type2: any): boolean {
    // указывает, являются ли эти два типа одинаковыми
    return type1 === type2;
  }

    highlightIcon(iconNode: Node) { // представляет собой узел иконки, которую нужно выделить
    const parent = iconNode.parent; // получаем родительский узел, чтобы затем добавить новый префаб
    const prefabIndex = Math.floor(Math.random() * this.iconPrefabs.length); // выбираем случайный тип из массива префабов
    const newIcon = instantiate(this.iconPrefabs[prefabIndex]); // создаем новый экземпляр выбранного префаба

    newIcon.position = iconNode.position; // устанавливаем позицию нового узла в ту же позицию, что и у старого
    iconNode.destroy(); // удаляем старую иконку
    parent.addChild(newIcon); // добавляем новый узел в родительский узел

    // устанавливаем анимацию для нового префаба
    const spineNode = newIcon.getComponent(sp.Skeleton);
    if (spineNode) {
        console.log("Skeleton component found");
        spineNode.setAnimation(0, "win", false);

        spineNode.setCompleteListener(() => {
        this.startButton.interactable = true; // разблокируем кнопку start
        this.inputM.enabled = true; // разблокируем поле ввода M
        this.inputN.enabled = true; // разблокируем поле ввода N
        this.inputX.enabled = true; // разблокируем поле ввода X
        this.inputY.enabled = true; // разблокируем поле ввода Y
        })
    } else {
        console.error("Skeleton component not found", newIcon.name); // устанавливаем анимацию "win"
    }
  }
}