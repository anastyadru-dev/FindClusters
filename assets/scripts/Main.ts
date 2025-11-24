import { _decorator, Component, Node, Prefab, Sprite, Button, instantiate, Vec3, EditBox, Skeleton, sp} from 'cc';
import { PrefabType } from './PrefabType'; // Импортируем PrefabType
const { ccclass, property } = _decorator;

@ccclass("Main")
export class Main extends Component {
  @property({ type: Node })
  gridParent: Node = null; // родительский объект для иконок

  @property({ type: [Prefab] })
  iconPrefabs: Prefab[] = []; // массив префабов иконок
  
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
  private M: number = 2;
  private N: number = 2;
  private X: number = 2;
  private Y: number = 2;

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
    const parsedM = parseInt(this.inputM.string);
    const parsedN = parseInt(this.inputN.string);
    const parsedX = parseInt(this.inputX.string);
    const parsedY = parseInt(this.inputY.string);

    if (!isNaN(parsedM) && parsedM > 0) this.M = parsedM;
    if (!isNaN(parsedN) && parsedN > 0) this.N = parsedN;
    if (!isNaN(parsedX) && parsedX > 0 && parsedX <= this.iconPrefabs.length) {
      this.X = parsedX;
    } else {
      this.X = Math.min(this.iconPrefabs.length, this.X); // Устанавливаем X не больше количества префабов
    }
    if (!isNaN(parsedY) && parsedY > 0) this.Y = parsedY;

    this.initGrid(); // обновляем сетку с новыми параметрами
  }

  generateGrid() {
    // заполнение поля новыми иконками
    const startX = -260; // начальная координата по X
    const startY = 270; // начальная координата по Y
    const spacingX = 65; // расстояние между иконками по X
    const spacingY = 65; // расстояние между иконками по Y

    for (let i = 0; i < this.M; i++) {
      for (let j = 0; j < this.N; j++) {
        const iconType = Math.floor(Math.random() * this.X); // выбираем случайный тип из массива префабов
        console.log(iconType);

        if (iconType >= 0 && iconType < this.iconPrefabs.length) { // работа с только допустимыми индексами
          const iconNode = instantiate(this.iconPrefabs[iconType]); // создаем иконку из выбранного префаба
          iconNode.setPosition(
            new Vec3(startX + i * spacingX, startY - j * spacingY, 0)); // установка позиции с учетом начальных координат и расстояния
          this.grid[i][j] = iconNode; // сохраняет ссылку на созданный узел иконки в двумерном массиве
          this.gridParent.addChild(iconNode); // делает иконку видимой на экране
        }
      }
    }
  }

  highlightClusters() {
    const visited: boolean[][] = Array.from({ length: this.M }, () => Array(this.N).fill(false));
     let foundCluster = false; // переменная для отслеживания наличия кластеров
    
    for (let i = 0; i < this.M; i++) {
      for (let j = 0; j < this.N; j++) {
        if (!visited[i][j]) {
          const cluster: Vec3[] = [];
          const prefabType = this.grid[i][j].getComponent(PrefabType).type; // Получаем тип префаба
          this.findCluster(i, j, prefabType, visited, cluster); // Ищем кластер
          
          if (cluster.length >= this.Y) { // Проверяем размер кластера
            cluster.forEach((pos) => {
              const iconNode = this.grid[pos.x][pos.y];
              this.highlightIcon(iconNode); // Изменяем иконку
            });
          }
        }
      }
    }
    // Проверяем, найден ли хотя бы один кластер
    if (!foundCluster) {
        this.startButton.interactable = true; // Разблокируем кнопку start
        this.inputM.enabled = true; // Разблокируем поле ввода M
        this.inputN.enabled = true; // Разблокируем поле ввода N
        this.inputX.enabled = true; // Разблокируем поле ввода X
        this.inputY.enabled = true; // Разблокируем поле ввода Y
    }
  }


   findCluster(x: number, y: number, iconType: any, visited: boolean[][], cluster: Vec3[]) {
    if (
      x < 0 || x >= this.M ||
      y < 0 || y >= this.N ||
      visited[x][y] ||
      !this.isSameType(this.grid[x][y].getComponent(PrefabType).type, iconType)
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

  isSameType(type1: any, type2: any): boolean {
    return type1 === type2;
  }

  highlightIcon(iconNode: Node) {
    const spineNode = iconNode.getComponent(sp.Skeleton);

    if (spineNode) {
      spineNode.setAnimation(0, "win", false); // Устанавливаем анимацию "win"

      spineNode.setCompleteListener(() => {
        this.startButton.interactable = true; // разблокируем кнопку start
        this.inputM.enabled = true; // разблокируем поле ввода M
        this.inputN.enabled = true; // разблокируем поле ввода N
        this.inputX.enabled = true; // разблокируем поле ввода X
        this.inputY.enabled = true; // разблокируем поле ввода Y
        })
    } else {
      console.error("Skeleton component not found", iconNode.name);
    }
  }
} 