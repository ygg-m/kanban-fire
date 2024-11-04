import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskService } from './services/taskService.service';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TaskComponent } from './task/task.component';
import { Task } from './tasks/task';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    TaskComponent,
    MatSlideToggleModule,
    MatCard,
    DragDropModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatInputModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  todo: Task[] = [];
  inProgress: Task[] = [];
  done: Task[] = [];

  dialog = inject(MatDialog);
  taskService = inject(TaskService);

  ngOnInit() {
    // Subscribe to the collections
    this.taskService.getTasks('todo').subscribe((tasks) => (this.todo = tasks));
    this.taskService
      .getTasks('inProgress')
      .subscribe((tasks) => (this.inProgress = tasks));
    this.taskService.getTasks('done').subscribe((tasks) => (this.done = tasks));
  }

  async editTask(
    list: 'done' | 'todo' | 'inProgress',
    task: Task
  ): Promise<void> {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '320px',
      data: {
        task: { ...task }, // Create a copy of the task
        enableDelete: true,
      },
    });

    try {
      const result = await firstValueFrom(dialogRef.afterClosed(), {
        defaultValue: undefined,
      });
      if (!result) {
        return;
      }

      if (result.delete) {
        if (task.id) {
          await this.taskService.deleteTask(list, task.id);
        }
      } else {
        if (task.id) {
          await this.taskService.updateTask(list, task.id, result.task);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Here you might want to show an error message to the user
    }
  }

  async drop(event: CdkDragDrop<Task[]>): Promise<void> {
    if (event.previousContainer === event.container) {
      return;
    }
    if (!event.container.data || !event.previousContainer.data) {
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    const fromList = this.getListName(event.previousContainer.id);
    const toList = this.getListName(event.container.id);

    console.log('Moving task:', {
      task,
      fromList,
      toList,
      previousContainerId: event.previousContainer.id,
      newContainerId: event.container.id,
    });

    try {
      // Move item in the UI immediately
      const currentTask = event.previousContainer.data[event.previousIndex];
      event.previousContainer.data.splice(event.previousIndex, 1);
      event.container.data.splice(event.currentIndex, 0, currentTask);

      if (fromList && toList) {
        await this.taskService.moveTask(fromList, toList, task);
        console.log('Task moved successfully');
      }
    } catch (error) {
      console.error('Error moving task:', error);
      // Revert the UI change
      const revertTask = event.container.data[event.currentIndex];
      event.container.data.splice(event.currentIndex, 1);
      event.previousContainer.data.splice(event.previousIndex, 0, revertTask);
    }
  }

  private getListName(id: string): string {
    const map: { [key: string]: string } = {
      'todo-list': 'todo',
      'inProgress-list': 'inProgress',
      'done-list': 'done',
    };
    return map[id];
  }

  async newTask(): Promise<void> {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '320px',
      data: {
        task: {},
      },
    });

    try {
      const result = await firstValueFrom(dialogRef.afterClosed(), {
        defaultValue: undefined,
      });
      if (result?.task?.title?.length) {
        await this.taskService.addTask('todo', result.task);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      // Here you might want to show an error message to the user
    }
  }
}
