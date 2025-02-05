import {
  ISessionContext,
  SessionContext,
  SessionContextDialogs
} from '@jupyterlab/apputils';

import {
  OutputArea,
  OutputAreaModel,
  //SimplifiedOutputArea
} from '@jupyterlab/outputarea';

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { KernelMessage, ServiceManager } from '@jupyterlab/services';

import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';

import { Message } from '@lumino/messaging';

import {
  SplitPanel,
  //StackedPanel
} from '@lumino/widgets';

/**
 * The class name added to the example panel.
 */
const PANEL_CLASS = 'jp-RovaPanel';

/**
 * A panel with the ability to add other children.
 */
export class ExamplePanel extends SplitPanel {
  constructor(
    manager: ServiceManager.IManager,
    rendermime: IRenderMimeRegistry,
    translator?: ITranslator
  ) {
    super();
    this._translator = translator || nullTranslator;
    this._trans = this._translator.load('jupyterlab');
    this.addClass(PANEL_CLASS);
    this.id = 'kernel-output-panel';
    this.title.label = this._trans.__('Kernel Output Example View');
    this.title.closable = true;

    this._sessionContext = new SessionContext({
      sessionManager: manager.sessions,
      specsManager: manager.kernelspecs,
      name: 'Kernel Output'
    });

    const model = manager.sessions.running();

    console.log(model);
    //if (model) {
    //    manager.sessions.connectTo({ model });
    //}

    this._outputareamodel = new OutputAreaModel();
    this._outputarea = new OutputArea({
      model: this._outputareamodel,
      rendermime: rendermime
    });

    this._sessionContextDialogs = new SessionContextDialogs({
      translator: translator
    });

    this.addWidget(this._outputarea);

    void this._sessionContext
      .initialize()
      .then(async value => {
        if (value) {
          console.log(this._sessionContext);
          await this._sessionContextDialogs.selectKernel(this._sessionContext);
        }
      })
      .catch(reason => {
        console.error(
          `Failed to initialize the session in ExamplePanel.\n${reason}`
        );
      });
  }

  get session(): ISessionContext {
    return this._sessionContext;
  }

  dispose(): void {
    this._sessionContext.dispose();
    super.dispose();
  }

  execute(code: string): void {
    OutputArea.execute(code, this._outputarea, this._sessionContext)
      .then((msg: KernelMessage.IExecuteReplyMsg | undefined) => {
        console.log(msg);
      })
      .catch(reason => console.error(reason));
  }

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.dispose();
  }

  private _sessionContext: SessionContext;
  private _outputarea: OutputArea;
  private _outputareamodel: OutputAreaModel;
  private _sessionContextDialogs: SessionContextDialogs;

  private _translator: ITranslator;
  private _trans: TranslationBundle;
}
