import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { CommonService } from '../../../../utils/services/common.service';

@Component({
  selector: 'odp-file-settings',
  templateUrl: './file-settings.component.html',
  styleUrls: ['./file-settings.component.scss']
})
export class FileSettingsComponent implements OnInit {
  @Input() form: FormGroup;
  @Input() edit: any;
  type: any;
  fileSettingForm: FormGroup
  showConnectors: boolean = false;
  connectorId: any;
  connectorList: any;
  subscriptions: any = {};
  constructor(
    private commonService: CommonService,
    private fb: FormBuilder
  ) {
    this.type = 'gridfs';
  }

  ngOnInit() {
    this.fileSettingForm = this.fb.group({
      type: [''],
      connectorId: ['']
    })
    if (!this.form.get('fileStorage')) {
      this.form.addControl('fileStorage', this.fileSettingForm)
    }
    else {
      this.type = this.form.get('fileStorage').value['type'];
      this.connectorId = this.form.get('fileStorage').value['connectorId']
      this.form.removeControl('fileStorage');
      this.form.addControl('fileStorage', this.fileSettingForm)
    }

    this.showConnectors = this.type === 'azure';
    this.form.get('fileStorage').get('type').setValue(this.type)
    this.form.get('fileStorage').get('connectorId').setValue(this.connectorId)


    this.getConnectors()
  }

  getConnectors() {
    if (this.subscriptions?.['getConnectors']) {
      this.subscriptions['getConnectors'].unsubscribe();
    }
    this.connectorList = [];
    this.subscriptions['getConnectors'] = this.commonService.get('user', `/${this.commonService.app._id}/connector/utils/count`)
      .pipe(switchMap((ev: any) => {
        return this.commonService.get('user', `/${this.commonService.app._id}/connector`, { count: ev });
      }))
      .subscribe(res => {
        if (res.length > 0) {
          res.forEach(_connector => {
            if (_connector.type === 'AZBLOB') {
              this.connectorList.push(_connector);
            }
          });
        }
      }, err => {
        this.commonService.errorToast(err, 'We are unable to fetch records, please try again later');
      });

  }

  changeType() {
    this.showConnectors = this.type === 'azure';
    if (this.type === 'azure') {
      this.form.get('fileStorage').get('connectorId').setValidators([Validators.required])
    }
    else {
      this.form.get('fileStorage').get('connectorId').clearValidators()
      this.connectorId = ''
      this.form.get('fileStorage').get('connectorId').reset()
    }
    this.form.get('fileStorage').get('type').setValue(this.type)
    this.form.get('fileStorage').get('connectorId').updateValueAndValidity()
  }

  selectConnector() {
    this.form.get('fileStorage').get('connectorId').setValue(this.connectorId)
  }

  canEdit(type: string) {
    if (this.hasPermission('PMDS' + type, 'SM')) {
      return true;
    }
    return false;
  }
  canView(type: string) {
    if (this.hasPermission('PMDS' + type, 'SM')
      || this.hasPermission('PVDS' + type, 'SM')) {
      return true;
    }
    return false;
  }



  hasPermission(type: string, entity?: string) {
    return this.commonService.hasPermission(type, entity);
  }

  hasPermissionStartsWith(type: string, entity?: string) {
    return this.commonService.hasPermissionStartsWith(type, entity);
  }

}
