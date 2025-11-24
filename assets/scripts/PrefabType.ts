import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PrefabType')
export class PrefabType extends Component {
    @property({ type: String }) // тип данных
    type: string = ''; // иницализация пременной
}