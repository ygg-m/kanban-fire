import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Task } from '../tasks/task';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  constructor(private firestore: Firestore) {}

  // Get tasks from a specific list
  getTasks(listName: string): Observable<Task[]> {
    const collectionRef = collection(this.firestore, listName);
    return collectionData(collectionRef, { idField: 'id' }) as Observable<
      Task[]
    >;
  }

  // Add a new task
  async addTask(listName: string, task: Task): Promise<string> {
    const collectionRef = collection(this.firestore, listName);
    const docRef = await addDoc(collectionRef, {
      title: task.title,
      description: task.description,
    });
    return docRef.id;
  }

  // Update a task
  async updateTask(
    listName: string,
    taskId: string,
    task: Task
  ): Promise<void> {
    if (!taskId) {
      throw new Error('Task ID is required for updates');
    }
    const docRef = doc(this.firestore, listName, taskId);
    await updateDoc(docRef, {
      title: task.title,
      description: task.description,
    });
  }

  // Delete a task
  async deleteTask(listName: string, taskId: string): Promise<void> {
    if (!taskId) {
      throw new Error('Task ID is required for deletion');
    }
    const docRef = doc(this.firestore, listName, taskId);
    await deleteDoc(docRef);
  }

  // Move task between lists
  async moveTask(fromList: string, toList: string, task: Task): Promise<void> {
    if (!task.id) {
      throw new Error('Task ID is required for moving tasks');
    }
    // Add to new list first, then delete from old list to prevent data loss
    await this.addTask(toList, task);
    await this.deleteTask(fromList, task.id);
  }
}
